import React, { useState } from "react";
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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const { signup } = useAuth();
  const { theme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [isNewShop, setIsNewShop] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (isNewShop && !shopName.trim()) {
      Alert.alert("Error", "Please enter a shop name");
      return;
    }

    setIsLoading(true);
    const result = await signup(
      email.trim(),
      password,
      fullName.trim(),
      isNewShop ? shopName.trim() : undefined
    );
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        "Success",
        "Account created successfully! Please check your email to verify your account.",
        [{ text: "OK", onPress: onNavigateToLogin }]
      );
    } else {
      Alert.alert("Signup Failed", result.error || "Failed to create account");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onNavigateToLogin}>
                <Feather name="arrow-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.text }]}>
                Create Account
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Join Mazao Animal Supplies POS
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="user" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.textSecondary}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
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
                <Text style={[styles.label, { color: theme.text }]}>Password *</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="lock" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Create a password"
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

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Confirm Password *
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="lock" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.shopToggle}>
                <TouchableOpacity
                  style={styles.toggleOption}
                  onPress={() => setIsNewShop(!isNewShop)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isNewShop ? Colors.primary.main : "transparent",
                        borderColor: isNewShop ? Colors.primary.main : theme.textSecondary,
                      },
                    ]}
                  >
                    {isNewShop && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.toggleText, { color: theme.text }]}>
                    I'm registering a new shop
                  </Text>
                </TouchableOpacity>
              </View>

              {isNewShop && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Shop Name *</Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name="home" size={20} color={theme.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Enter your shop name"
                      placeholderTextColor={theme.textSecondary}
                      value={shopName}
                      onChangeText={setShopName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.signupButton, { backgroundColor: Colors.primary.main }]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={onNavigateToLogin}>
                  <Text style={[styles.loginLink, { color: Colors.primary.main }]}>
                    {" "}Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 16,
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
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  shopToggle: {
    marginTop: 8,
  },
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "500",
  },
  signupButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
