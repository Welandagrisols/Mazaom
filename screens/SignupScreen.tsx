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
  const { signupWithLicense } = useAuth();
  const { theme } = useTheme();
  const [licenseKey, setLicenseKey] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!licenseKey.trim()) {
      Alert.alert("Error", "Please enter your license key");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (!fullName.trim() || !email.trim() || !password.trim() || !shopName.trim()) {
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

    setIsLoading(true);
    const result = await signupWithLicense(
      licenseKey.trim().toUpperCase(),
      phone.trim(),
      email.trim(),
      password,
      fullName.trim(),
      shopName.trim()
    );
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        "Success",
        "Your shop has been created! Please check your email to verify your account, then login.",
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
              <TouchableOpacity style={styles.backButton} onPress={onNavigateToLogin} activeOpacity={0.7}>
                <Feather name="arrow-left" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.text }]}>
                Register Your Shop
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Enter your license key to get started
              </Text>
            </View>

            <View style={styles.form}>
              <View style={[styles.licenseBox, { backgroundColor: Colors.primary.main + "10", borderColor: Colors.primary.main }]}>
                <Feather name="key" size={24} color={Colors.primary.main} />
                <View style={styles.licenseContent}>
                  <Text style={[styles.licenseLabel, { color: Colors.primary.main }]}>
                    License Key *
                  </Text>
                  <TextInput
                    style={[styles.licenseInput, { color: theme.text }]}
                    placeholder="Enter your license key"
                    placeholderTextColor={theme.textSecondary}
                    value={licenseKey}
                    onChangeText={(text) => setLicenseKey(text.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Phone Number *</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="phone" size={20} color={theme.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="e.g. +254712345678"
                    placeholderTextColor={theme.textSecondary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                </View>
              </View>

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

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Your Full Name *</Text>
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

              <TouchableOpacity
                style={[styles.signupButton, { backgroundColor: Colors.primary.main }, isLoading && { opacity: 0.7 }]}
                onPress={handleSignup}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signupButtonText}>Register Shop</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                  <Text style={[styles.loginLink, { color: Colors.primary.main }]}>
                    {" "}Login
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="info" size={16} color={theme.textSecondary} />
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Don't have a license key? Contact us to get one for your shop.
                </Text>
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
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    gap: 10,
  },
  licenseBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  licenseContent: {
    flex: 1,
  },
  licenseLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  licenseInput: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  signupButton: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
