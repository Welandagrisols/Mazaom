import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth, LastShopInfo } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getSupabase, isSupabaseConfigured } from "@/utils/supabase";

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onNavigateToStaffLogin: () => void;
}

export default function LoginScreen({ onNavigateToSignup, onNavigateToStaffLogin }: LoginScreenProps) {
  const { adminLogin, lastShopInfo, lookupShopByCode, setLastShopInfo, clearLastShopInfo } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showShopCodeModal, setShowShopCodeModal] = useState(false);
  const [shopCodeInput, setShopCodeInput] = useState("");
  const [isLookingUpShop, setIsLookingUpShop] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const displayedShopName = lastShopInfo?.name || "AgroVet POS";

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }

    setIsLoading(true);
    const result = await adminLogin(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert("Login Failed", result.error || "Invalid credentials");
    }
  };

  const handleSwitchShop = () => {
    setShopCodeInput("");
    setShowShopCodeModal(true);
  };

  const handleLookupShop = async () => {
    if (!shopCodeInput.trim()) {
      Alert.alert("Error", "Please enter a shop code");
      return;
    }

    setIsLookingUpShop(true);
    const result = await lookupShopByCode(shopCodeInput.trim());
    setIsLookingUpShop(false);

    if (result.success && result.shop) {
      await setLastShopInfo(result.shop);
      setShowShopCodeModal(false);
      Alert.alert("Success", `Switched to ${result.shop.name}`);
    } else {
      Alert.alert("Error", result.error || "Shop not found");
    }
  };

  const handleClearShop = async () => {
    await clearLastShopInfo();
    setShowShopCodeModal(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!isSupabaseConfigured()) {
      Alert.alert(
        "Demo Mode",
        "Password reset is not available in demo mode. Please contact your administrator."
      );
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      Alert.alert("Error", "Database not configured");
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Check Your Email",
          "If an account exists with this email, you will receive a password reset link shortly.",
          [{ text: "OK", onPress: () => setShowForgotPasswordModal(false) }]
        );
        setResetEmail("");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const openForgotPasswordModal = () => {
    setResetEmail(email);
    setShowForgotPasswordModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: Colors.primary.main }]}>
              <Feather name="shopping-bag" size={48} color="#FFFFFF" />
            </View>
            <Text style={[styles.appName, { color: Colors.primary.main }]}>
              {displayedShopName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Admin Login
            </Text>
            {lastShopInfo && (
              <TouchableOpacity onPress={handleSwitchShop} style={styles.switchShopButton}>
                <Feather name="repeat" size={14} color={Colors.primary.main} />
                <Text style={[styles.switchShopText, { color: Colors.primary.main }]}>
                  Switch Shop
                </Text>
              </TouchableOpacity>
            )}
            {!lastShopInfo && (
              <TouchableOpacity onPress={handleSwitchShop} style={styles.switchShopButton}>
                <Feather name="home" size={14} color={Colors.primary.main} />
                <Text style={[styles.switchShopText, { color: Colors.primary.main }]}>
                  Enter Shop Code
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="mail" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="lock" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: rememberMe ? Colors.primary.main : "transparent",
                      borderColor: rememberMe ? Colors.primary.main : theme.textSecondary,
                    },
                  ]}
                >
                  {rememberMe && <Feather name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.rememberMeText, { color: theme.text }]}>
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={openForgotPasswordModal}>
                <Text style={[styles.forgotPassword, { color: Colors.primary.main }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: Colors.primary.main }, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
            </View>

            <TouchableOpacity
              style={[styles.staffButton, { borderColor: Colors.primary.main }]}
              onPress={onNavigateToStaffLogin}
              activeOpacity={0.7}
            >
              <Feather name="users" size={20} color={Colors.primary.main} />
              <Text style={[styles.staffButtonText, { color: Colors.primary.main }]}>
                Staff Login (PIN)
              </Text>
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: theme.textSecondary }]}>
                New shop? Have a license key?
              </Text>
              <TouchableOpacity onPress={onNavigateToSignup} activeOpacity={0.7}>
                <Text style={[styles.signupLink, { color: Colors.primary.main }]}>
                  {" "}Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showShopCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShopCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {lastShopInfo ? "Switch Shop" : "Enter Shop Code"}
              </Text>
              <TouchableOpacity onPress={() => setShowShopCodeModal(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Enter your shop code to personalize your login screen. You can find your shop code in your account settings.
            </Text>

            <View style={[styles.modalInputContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="hash" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                placeholder="Enter shop code (e.g., ABC12345)"
                placeholderTextColor={theme.textSecondary}
                value={shopCodeInput}
                onChangeText={(text) => setShopCodeInput(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.primary.main }, isLookingUpShop && { opacity: 0.7 }]}
              onPress={handleLookupShop}
              disabled={isLookingUpShop}
              activeOpacity={0.7}
            >
              {isLookingUpShop ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonText}>Find My Shop</Text>
              )}
            </TouchableOpacity>

            {lastShopInfo && (
              <TouchableOpacity
                style={[styles.clearButton]}
                onPress={handleClearShop}
              >
                <Text style={[styles.clearButtonText, { color: theme.textSecondary }]}>
                  Clear saved shop
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showForgotPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Reset Password
              </Text>
              <TouchableOpacity onPress={() => setShowForgotPasswordModal(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <View style={[styles.modalInputContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="mail" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: Colors.primary.main }, isResettingPassword && { opacity: 0.7 }]}
              onPress={handleForgotPassword}
              disabled={isResettingPassword}
              activeOpacity={0.7}
            >
              {isResettingPassword ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setShowForgotPasswordModal(false)}
            >
              <Text style={[styles.clearButtonText, { color: theme.textSecondary }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "flex-start",
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  switchShopButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  switchShopText: {
    fontSize: 14,
    fontWeight: "500",
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberMeText: {
    fontSize: 14,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  staffButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    marginBottom: 4,
  },
  staffButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 2,
  },
  modalButton: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    fontSize: 14,
  },
});
