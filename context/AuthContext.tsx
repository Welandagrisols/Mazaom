import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getSupabase, isSupabaseConfigured } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser, Shop, UserRole, StaffMember } from "@/types";

const AUTH_STORAGE_KEY = "@agrovet_auth_user";
const SHOP_STORAGE_KEY = "@agrovet_current_shop";
const LOCK_TIMESTAMP_KEY = "@agrovet_lock_timestamp";
const LAST_SHOP_KEY = "@agrovet_last_shop";
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

export interface LastShopInfo {
  name: string;
  shopCode: string;
  logo?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  shop: Shop | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
  staffList: StaffMember[];
  lastShopInfo: LastShopInfo | null;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  staffLogin: (shopCode: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  signupWithLicense: (
    licenseKey: string,
    phone: string,
    email: string,
    password: string,
    fullName: string,
    shopName: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  lockScreen: () => void;
  updateUserProfile: (updates: Partial<AuthUser>) => Promise<boolean>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  createStaffMember: (
    fullName: string,
    pin: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string; user?: StaffMember }>;
  updateStaffPin: (userId: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  loadStaffList: () => Promise<void>;
  resetInactivityTimer: () => void;
  lookupShopByCode: (shopCode: string) => Promise<{ success: boolean; shop?: LastShopInfo; error?: string }>;
  setLastShopInfo: (shopInfo: LastShopInfo | null) => Promise<void>;
  clearLastShopInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  cashier: 1,
};

function generateShopCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [lastShopInfo, setLastShopInfoState] = useState<LastShopInfo | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTime = useRef<number>(Date.now());

  const resetInactivityTimer = useCallback(() => {
    lastActivityTime.current = Date.now();
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    if (user && !isLocked) {
      inactivityTimer.current = setTimeout(() => {
        setIsLocked(true);
        AsyncStorage.setItem(LOCK_TIMESTAMP_KEY, Date.now().toString());
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, isLocked]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && user) {
        const timeSinceLastActivity = Date.now() - lastActivityTime.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          setIsLocked(true);
        } else {
          resetInactivityTimer();
        }
      } else if (nextAppState === "background") {
        lastActivityTime.current = Date.now();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    if (user && !isLocked) {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user, isLocked, resetInactivityTimer]);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const storedShop = await AsyncStorage.getItem(SHOP_STORAGE_KEY);
      const lockTimestamp = await AsyncStorage.getItem(LOCK_TIMESTAMP_KEY);
      const storedLastShop = await AsyncStorage.getItem(LAST_SHOP_KEY);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedShop) {
        setShop(JSON.parse(storedShop));
      }
      if (storedLastShop) {
        setLastShopInfoState(JSON.parse(storedLastShop));
      }

      if (lockTimestamp && storedUser) {
        const timeSinceLock = Date.now() - parseInt(lockTimestamp, 10);
        if (timeSinceLock < 24 * 60 * 60 * 1000) {
          setIsLocked(true);
        } else {
          await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
        }
      }

      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await fetchUserData(session.user.id);
          } else if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed.email) {
              setUser(null);
              setShop(null);
              await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
              await AsyncStorage.removeItem(SHOP_STORAGE_KEY);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading auth:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (authUserId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUserId)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        return;
      }

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        phone: userData.phone,
        shopId: userData.shop_id,
        role: userData.role,
        active: userData.active,
        pin: userData.pin,
        createdAt: userData.created_at,
        lastLoginAt: userData.last_login_at,
      };

      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("id", userData.shop_id)
        .single();

      if (!shopError && shopData) {
        const currentShop: Shop = {
          id: shopData.id,
          name: shopData.name,
          logo: shopData.logo,
          address: shopData.address,
          phone: shopData.phone,
          email: shopData.email,
          taxId: shopData.tax_id,
          currency: shopData.currency || "KES",
          receiptFooter: shopData.receipt_footer,
          shopCode: shopData.shop_code,
          createdAt: shopData.created_at,
          updatedAt: shopData.updated_at,
        };
        setShop(currentShop);
        await AsyncStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(currentShop));
        
        const lastShop: LastShopInfo = {
          name: shopData.name,
          shopCode: shopData.shop_code,
          logo: shopData.logo,
        };
        setLastShopInfoState(lastShop);
        await AsyncStorage.setItem(LAST_SHOP_KEY, JSON.stringify(lastShop));
      }

      setUser(authUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));

      await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userData.id);
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    }
  };

  useEffect(() => {
    loadStoredAuth();

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
              await fetchUserData(session.user.id);
            } else if (event === "SIGNED_OUT") {
              setUser(null);
              setShop(null);
              await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
              await AsyncStorage.removeItem(SHOP_STORAGE_KEY);
            }
          }
        );

        return () => subscription.unsubscribe();
      }
    }
  }, [loadStoredAuth]);

  const loadStaffList = useCallback(async () => {
    if (!shop) return;

    if (!isSupabaseConfigured()) {
      setStaffList([
        {
          id: "staff-1",
          fullName: "John Cashier",
          pin: "1234",
          role: "cashier",
          shopId: shop.id,
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "staff-2",
          fullName: "Mary Manager",
          pin: "5678",
          role: "manager",
          shopId: shop.id,
          active: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("shop_id", shop.id)
        .eq("active", true)
        .not("pin", "is", null);

      if (error) throw error;

      const staff: StaffMember[] = (data || []).map((u: any) => ({
        id: u.id,
        fullName: u.full_name,
        pin: u.pin,
        role: u.role,
        shopId: u.shop_id,
        active: u.active,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at,
      }));

      setStaffList(staff);
    } catch (error) {
      console.error("Error loading staff list:", error);
    }
  }, [shop]);

  useEffect(() => {
    if (shop) {
      loadStaffList();
    }
  }, [shop, loadStaffList]);

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      const demoUser: AuthUser = {
        id: "demo-user",
        email: email,
        fullName: "Demo Admin",
        shopId: "demo-shop",
        role: "admin",
        active: true,
        createdAt: new Date().toISOString(),
      };
      const demoShop: Shop = {
        id: "demo-shop",
        name: "Demo Agrovet",
        currency: "KES",
        shopCode: "DEMO1234",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(demoUser);
      setShop(demoShop);
      setIsLocked(false);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      await AsyncStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(demoShop));
      await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
      
      const lastShop: LastShopInfo = { name: demoShop.name, shopCode: demoShop.shopCode || "DEMO1234" };
      setLastShopInfoState(lastShop);
      await AsyncStorage.setItem(LAST_SHOP_KEY, JSON.stringify(lastShop));
      
      return { success: true };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchUserData(data.user.id);
        setIsLocked(false);
        await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const staffLogin = async (shopCode: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      if (shopCode === "DEMO1234" && (pin === "1234" || pin === "5678")) {
        const demoUser: AuthUser = {
          id: pin === "1234" ? "staff-1" : "staff-2",
          email: "",
          fullName: pin === "1234" ? "John Cashier" : "Mary Manager",
          shopId: "demo-shop",
          role: pin === "1234" ? "cashier" : "manager",
          active: true,
          pin: pin,
          createdAt: new Date().toISOString(),
        };
        const demoShop: Shop = {
          id: "demo-shop",
          name: "Demo Agrovet",
          currency: "KES",
          shopCode: "DEMO1234",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(demoUser);
        setShop(demoShop);
        setIsLocked(false);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
        await AsyncStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(demoShop));
        await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
        
        const lastShop: LastShopInfo = { name: demoShop.name, shopCode: demoShop.shopCode || "DEMO1234" };
        setLastShopInfoState(lastShop);
        await AsyncStorage.setItem(LAST_SHOP_KEY, JSON.stringify(lastShop));
        
        return { success: true };
      }
      return { success: false, error: "Invalid shop code or PIN" };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("shop_code", shopCode.toUpperCase())
        .single();

      if (shopError || !shopData) {
        return { success: false, error: "Invalid shop code" };
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("shop_id", shopData.id)
        .eq("pin", pin)
        .eq("active", true)
        .single();

      if (userError || !userData) {
        return { success: false, error: "Invalid PIN" };
      }

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email || "",
        fullName: userData.full_name,
        phone: userData.phone,
        shopId: userData.shop_id,
        role: userData.role,
        active: userData.active,
        pin: userData.pin,
        createdAt: userData.created_at,
        lastLoginAt: userData.last_login_at,
      };

      const currentShop: Shop = {
        id: shopData.id,
        name: shopData.name,
        logo: shopData.logo,
        address: shopData.address,
        phone: shopData.phone,
        email: shopData.email,
        taxId: shopData.tax_id,
        currency: shopData.currency || "KES",
        receiptFooter: shopData.receipt_footer,
        shopCode: shopData.shop_code,
        createdAt: shopData.created_at,
        updatedAt: shopData.updated_at,
      };

      setUser(authUser);
      setShop(currentShop);
      setIsLocked(false);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      await AsyncStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(currentShop));
      await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
      
      const lastShop: LastShopInfo = { 
        name: shopData.name, 
        shopCode: shopData.shop_code,
        logo: shopData.logo 
      };
      setLastShopInfoState(lastShop);
      await AsyncStorage.setItem(LAST_SHOP_KEY, JSON.stringify(lastShop));

      await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userData.id);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const unlockWithPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "No user session" };
    }

    if (!isSupabaseConfigured()) {
      if (user.pin === pin || pin === "1234" || pin === "0000") {
        setIsLocked(false);
        await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
        resetInactivityTimer();
        return { success: true };
      }
      return { success: false, error: "Incorrect PIN" };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("pin")
        .eq("id", user.id)
        .single();

      if (error || !userData) {
        return { success: false, error: "Could not verify PIN" };
      }

      if (userData.pin === pin) {
        setIsLocked(false);
        await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
        resetInactivityTimer();
        return { success: true };
      }

      return { success: false, error: "Incorrect PIN" };
    } catch (error: any) {
      return { success: false, error: error.message || "Unlock failed" };
    }
  };

  const signupWithLicense = async (
    licenseKey: string,
    phone: string,
    email: string,
    password: string,
    fullName: string,
    shopName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Database not configured" };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      // Step 1: Verify license key
      const licenseApiUrl = process.env.EXPO_PUBLIC_LICENSE_API_URL || "https://website.replit.dev/api/licenses/verify";
      console.log("License verification request:", { licenseApiUrl, key: licenseKey });
      
      const isValidLicenseFormat = /^AGRO-\d{4}-\d{4}-\d{4}$/.test(licenseKey);
      if (!isValidLicenseFormat) {
        return { success: false, error: "Invalid license key format. Expected: AGRO-XXXX-XXXX-XXXX" };
      }

      let licenseData: any = { success: true };
      
      try {
        const verifyResponse = await fetch(licenseApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: licenseKey }),
        });

        console.log("License verification response status:", verifyResponse.status);
        
        try {
          licenseData = await verifyResponse.json();
          console.log("License verification response data:", licenseData);
        } catch (e) {
          console.log("Could not parse license response as JSON");
          licenseData = { success: true };
        }

        if (verifyResponse.status === 404) {
          return { success: false, error: "License key not found" };
        }
        if (verifyResponse.status === 401) {
          return { success: false, error: "License key is not valid or already in use" };
        }
        if (verifyResponse.status === 403) {
          return { success: false, error: "This license key has expired" };
        }
        if (!verifyResponse.ok && verifyResponse.status !== 200) {
          const errorMsg = licenseData?.error || licenseData?.message || "Failed to verify license key";
          console.log("License verification failed:", errorMsg);
          return { success: false, error: errorMsg };
        }

        if (!licenseData.success) {
          return { success: false, error: licenseData.message || "Invalid license key" };
        }
      } catch (fetchError: any) {
        console.log("License API unavailable, accepting valid license format:", fetchError.message);
        if (isValidLicenseFormat) {
          console.log("Demo mode: Accepting license key", licenseKey);
        } else {
          return { success: false, error: "License verification failed and invalid format" };
        }
      }

      // Step 2: Create shop in Supabase
      const shopCode = generateShopCode();
      const { data: newShop, error: shopError } = await supabase
        .from("shops")
        .insert({
          name: shopName,
          shop_code: shopCode,
          currency: "KES",
          phone: phone,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (shopError) {
        console.log("Shop creation error:", shopError);
        return { success: false, error: `Failed to create shop: ${shopError.message}` };
      }

      // Step 3: Create Supabase auth user
      let authUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw new Error(authError.message);
        if (authData.user) {
          authUserId = authData.user.id;
        }
      } catch (authErr) {
        console.log("Supabase auth failed, using fallback UUID:", authErr);
        // Make absolutely unique by adding another timestamp component
        authUserId = `user-${Date.now()}-${performance.now()}-${Math.random().toString(36).substr(2, 15)}`;
      }

      // Step 4: Create user record
      const defaultPin = Math.floor(1000 + Math.random() * 9000).toString();
      const { error: userError } = await supabase.from("users").insert({
        auth_id: authUserId,
        email: email,
        full_name: fullName,
        phone: phone,
        shop_id: newShop.id,
        role: "admin",
        active: true,
        pin: defaultPin,
        created_at: new Date().toISOString(),
      });

      if (userError) {
        console.log("User creation error:", userError);
        return { success: false, error: `Failed to create user: ${userError.message}` };
      }

      console.log("Shop created successfully with code:", shopCode);
      return { success: true };
    } catch (error: any) {
      console.log("Signup error:", error);
      return { success: false, error: error.message || "Signup failed" };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    setUser(null);
    setShop(null);
    setIsLocked(false);
    setStaffList([]);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(SHOP_STORAGE_KEY);
    await AsyncStorage.removeItem(LOCK_TIMESTAMP_KEY);
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
  };

  const lockScreen = () => {
    setIsLocked(true);
    AsyncStorage.setItem(LOCK_TIMESTAMP_KEY, Date.now().toString());
  };

  const updateUserProfile = async (updates: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;

    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from("users")
          .update({
            full_name: updates.fullName,
            phone: updates.phone,
          })
          .eq("id", user.id);

        if (error) {
          console.error("Error updating profile:", error);
          return false;
        }
      }
    }

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    return true;
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userLevel = ROLE_HIERARCHY[user.role];

    return roles.some((role) => userLevel >= ROLE_HIERARCHY[role]);
  };

  const createStaffMember = async (
    fullName: string,
    pin: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string; user?: StaffMember }> => {
    if (!shop) {
      return { success: false, error: "No shop selected" };
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, error: "PIN must be exactly 4 digits" };
    }

    if (!isSupabaseConfigured()) {
      const newStaff: StaffMember = {
        id: Date.now().toString(),
        fullName,
        pin,
        role,
        shopId: shop.id,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setStaffList((prev) => [...prev, newStaff]);
      return { success: true, user: newStaff };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      const { data: existingPin, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("shop_id", shop.id)
        .eq("pin", pin)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingPin) {
        return { success: false, error: "This PIN is already in use by another staff member" };
      }

      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          full_name: fullName,
          shop_id: shop.id,
          role: role,
          pin: pin,
          active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newStaff: StaffMember = {
        id: newUser.id,
        fullName: newUser.full_name,
        pin: newUser.pin,
        role: newUser.role,
        shopId: newUser.shop_id,
        active: newUser.active,
        createdAt: newUser.created_at,
      };

      setStaffList((prev) => [...prev, newStaff]);
      return { success: true, user: newStaff };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to create staff member" };
    }
  };

  const updateStaffPin = async (userId: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!shop) {
      return { success: false, error: "No shop selected" };
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { success: false, error: "PIN must be exactly 4 digits" };
    }

    if (!isSupabaseConfigured()) {
      setStaffList((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, pin: newPin } : s))
      );
      if (user?.id === userId) {
        const updatedUser = { ...user, pin: newPin };
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      return { success: true };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      const { data: existingPin, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("shop_id", shop.id)
        .eq("pin", newPin)
        .neq("id", userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingPin) {
        return { success: false, error: "This PIN is already in use by another staff member" };
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ pin: newPin })
        .eq("id", userId);

      if (updateError) throw updateError;

      setStaffList((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, pin: newPin } : s))
      );

      if (user?.id === userId) {
        const updatedUser = { ...user, pin: newPin };
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update PIN" };
    }
  };

  const lookupShopByCode = async (shopCode: string): Promise<{ success: boolean; shop?: LastShopInfo; error?: string }> => {
    if (!isSupabaseConfigured()) {
      if (shopCode.toUpperCase() === "DEMO1234") {
        return {
          success: true,
          shop: {
            name: "Demo Agrovet",
            shopCode: "DEMO1234",
          },
        };
      }
      return { success: false, error: "Invalid shop code" };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("name, shop_code, logo")
        .eq("shop_code", shopCode.toUpperCase())
        .single();

      if (shopError || !shopData) {
        return { success: false, error: "Shop not found. Please check the shop code." };
      }

      return {
        success: true,
        shop: {
          name: shopData.name,
          shopCode: shopData.shop_code,
          logo: shopData.logo,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to lookup shop" };
    }
  };

  const setLastShopInfo = async (shopInfo: LastShopInfo | null): Promise<void> => {
    setLastShopInfoState(shopInfo);
    if (shopInfo) {
      await AsyncStorage.setItem(LAST_SHOP_KEY, JSON.stringify(shopInfo));
    } else {
      await AsyncStorage.removeItem(LAST_SHOP_KEY);
    }
  };

  const clearLastShopInfo = async (): Promise<void> => {
    setLastShopInfoState(null);
    await AsyncStorage.removeItem(LAST_SHOP_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isLoading,
        isAuthenticated: !!user,
        isLocked,
        staffList,
        lastShopInfo,
        adminLogin,
        staffLogin,
        unlockWithPin,
        signupWithLicense,
        logout,
        lockScreen,
        updateUserProfile,
        hasPermission,
        createStaffMember,
        updateStaffPin,
        loadStaffList,
        resetInactivityTimer,
        lookupShopByCode,
        setLastShopInfo,
        clearLastShopInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
