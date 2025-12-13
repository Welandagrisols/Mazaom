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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface StaffLoginScreenProps {
  onNavigateToAdminLogin: () => void;
}

export default function StaffLoginScreen({ onNavigateToAdminLogin }: StaffLoginScreenProps) {
  const { staffLogin } = useAuth();
  const { theme } = useTheme();
  const [shopCode, setShopCode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!shopCode.trim()) {
      Alert.alert("Error", "Please enter your shop code");
      return;
    }

    if (!pin.trim() || pin.length !== 4) {
      Alert.alert("Error", "Please enter your 4-digit PIN");
      return;
    }

    setIsLoading(true);
    const result = await staffLogin(shopCode.trim().toUpperCase(), pin);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert("Login Failed", result.error || "Invalid shop code or PIN");
    }
  };

  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(numericText);
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
              AgroVet POS
            </Text>
            <Text style={[styles.byLine, { color: theme.textSecondary }]}>
              by Agrisols Systems
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Staff Login
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Shop Code</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="home" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter shop code"
                  placeholderTextColor={theme.textSecondary}
                  value={shopCode}
                  onChangeText={(text) => setShopCode(text.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Your PIN</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="lock" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text, letterSpacing: 8, fontSize: 24 }]}
                  placeholder="••••"
                  placeholderTextColor={theme.textSecondary}
                  value={pin}
                  onChangeText={handlePinChange}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: Colors.primary.main }]}
              onPress={handleLogin}
              disabled={isLoading}
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
              style={[styles.adminButton, { borderColor: Colors.primary.main }]}
              onPress={onNavigateToAdminLogin}
            >
              <Feather name="shield" size={20} color={Colors.primary.main} />
              <Text style={[styles.adminButtonText, { color: Colors.primary.main }]}>
                Admin Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  byLine: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
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
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
