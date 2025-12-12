import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export default function LockScreen() {
  const { user, shop, unlockWithPin, logout } = useAuth();
  const { theme } = useTheme();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = async () => {
    if (pin.length !== 4) {
      Alert.alert("Error", "Please enter your 4-digit PIN");
      return;
    }

    setIsLoading(true);
    const result = await unlockWithPin(pin);
    setIsLoading(false);

    if (!result.success) {
      Vibration.vibrate(200);
      setPin("");
      setAttempts((prev) => prev + 1);

      if (attempts >= 4) {
        Alert.alert(
          "Too Many Attempts",
          "You have entered the wrong PIN too many times. Please log in again.",
          [{ text: "OK", onPress: () => logout() }]
        );
      } else {
        Alert.alert("Incorrect PIN", `${5 - attempts - 1} attempts remaining`);
      }
    }
  };

  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(numericText);
  };

  const handleLogout = () => {
    Alert.alert(
      "Switch User",
      "Are you sure you want to log out and switch to a different user?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Switch User", onPress: () => logout(), style: "destructive" },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.content}>
        <View style={styles.lockIconContainer}>
          <View style={[styles.lockCircle, { backgroundColor: Colors.primary.main + "20" }]}>
            <Feather name="lock" size={48} color={Colors.primary.main} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Screen Locked</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your PIN to continue
        </Text>

        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary.main }]}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.fullName}</Text>
            <Text style={[styles.shopName, { color: theme.textSecondary }]}>{shop?.name}</Text>
          </View>
        </View>

        <View style={styles.pinContainer}>
          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <TextInput
              style={[styles.pinInput, { color: theme.text }]}
              placeholder="••••"
              placeholderTextColor={theme.textSecondary}
              value={pin}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.unlockButton, { backgroundColor: Colors.primary.main }]}
          onPress={handleUnlock}
          disabled={isLoading || pin.length !== 4}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="unlock" size={20} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>Unlock</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchUserButton} onPress={handleLogout}>
          <Feather name="users" size={18} color={theme.textSecondary} />
          <Text style={[styles.switchUserText, { color: theme.textSecondary }]}>
            Switch User
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIconContainer: {
    marginBottom: 24,
  },
  lockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
  },
  shopName: {
    fontSize: 14,
  },
  pinContainer: {
    width: "100%",
    marginBottom: 24,
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pinInput: {
    fontSize: 32,
    textAlign: "center",
    letterSpacing: 16,
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    gap: 8,
    width: "100%",
  },
  unlockButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  switchUserButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
    padding: 12,
  },
  switchUserText: {
    fontSize: 16,
  },
});
