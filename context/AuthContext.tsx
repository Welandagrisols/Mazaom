import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSupabase, isSupabaseConfigured } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser, Shop, UserRole } from "@/types";

const AUTH_STORAGE_KEY = "@agrovet_auth_user";
const SHOP_STORAGE_KEY = "@agrovet_current_shop";

interface AuthContextType {
  user: AuthUser | null;
  shop: Shop | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string, shopName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<AuthUser>) => Promise<boolean>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  cashier: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const storedShop = await AsyncStorage.getItem(SHOP_STORAGE_KEY);
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedShop) {
        setShop(JSON.parse(storedShop));
      }

      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await fetchUserData(session.user.id);
          } else if (storedUser) {
            setUser(null);
            setShop(null);
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            await AsyncStorage.removeItem(SHOP_STORAGE_KEY);
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
          createdAt: shopData.created_at,
          updatedAt: shopData.updated_at,
        };
        setShop(currentShop);
        await AsyncStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(currentShop));
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      const demoUser: AuthUser = {
        id: "demo-user",
        email: email,
        fullName: "Demo User",
        shopId: "demo-shop",
        role: "admin",
        active: true,
        createdAt: new Date().toISOString(),
      };
      const demoShop: Shop = {
        id: "demo-shop",
        name: "Mazao Animal Supplies",
        currency: "KES",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(demoUser);
      setShop(demoShop);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      await AsyncStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(demoShop));
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
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    shopName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: "Database not configured" };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: "Database not configured" };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Signup failed" };
      }

      let shopId: string;

      if (shopName) {
        const { data: newShop, error: shopError } = await supabase
          .from("shops")
          .insert({
            name: shopName,
            currency: "KES",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (shopError) {
          return { success: false, error: "Failed to create shop" };
        }
        shopId = newShop.id;
      } else {
        const { data: existingShops } = await supabase
          .from("shops")
          .select("id")
          .limit(1);
        
        if (existingShops && existingShops.length > 0) {
          shopId = existingShops[0].id;
        } else {
          const { data: newShop, error: shopError } = await supabase
            .from("shops")
            .insert({
              name: "Mazao Animal Supplies",
              currency: "KES",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (shopError) {
            return { success: false, error: "Failed to create default shop" };
          }
          shopId = newShop.id;
        }
      }

      const { error: userError } = await supabase.from("users").insert({
        auth_id: authData.user.id,
        email: email,
        full_name: fullName,
        shop_id: shopId,
        role: shopName ? "admin" : "cashier",
        active: true,
        created_at: new Date().toISOString(),
      });

      if (userError) {
        return { success: false, error: "Failed to create user profile" };
      }

      return { success: true };
    } catch (error: any) {
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
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(SHOP_STORAGE_KEY);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUserProfile,
        hasPermission,
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
