import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { Colors } from "@/constants/theme";

interface RoleGuardProps {
  requiredRole: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export function RoleGuard({
  requiredRole,
  children,
  fallback,
  showAccessDenied = false,
}: RoleGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <View style={styles.container}>
          <Feather name="lock" size={48} color={Colors.accent.error} />
          <ThemedText style={styles.title}>Access Denied</ThemedText>
          <ThemedText style={styles.message}>
            You don't have permission to access this feature.
          </ThemedText>
        </View>
      );
    }

    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
});
