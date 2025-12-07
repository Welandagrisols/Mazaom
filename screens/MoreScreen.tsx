import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { MenuListItem } from "@/components/MenuListItem";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getGreeting } from "@/utils/format";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type MoreScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "More">;
};

export default function MoreScreen({ navigation }: MoreScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, customers, suppliers, transactions, getTotalOutstandingDebt, getCustomersWithDebt } = useApp();
  const customersWithDebt = getCustomersWithDebt();
  const totalDebt = getTotalOutstandingDebt();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.userCard, { backgroundColor: Colors.primary.main }]}>
          <View style={styles.userIcon}>
            <Feather name="user" size={32} color={Colors.primary.main} />
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
              {getGreeting()}
            </ThemedText>
            <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
              {user?.fullName || "Guest User"}
            </ThemedText>
            <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Cashier"}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Management
        </ThemedText>
        <MenuListItem
          title="Customers"
          subtitle="Manage customer accounts"
          icon="users"
          iconColor={Colors.primary.main}
          badge={customers.length}
          onPress={() => navigation.navigate("Customers")}
        />
        <MenuListItem
          title="Customer Credits"
          subtitle="Manage debts and payments"
          icon="credit-card"
          iconColor={Colors.accent.error}
          badge={customersWithDebt.length > 0 ? customersWithDebt.length : undefined}
          onPress={() => navigation.navigate("CustomerCredits")}
        />
        <MenuListItem
          title="Suppliers"
          subtitle="Manage supplier information"
          icon="truck"
          iconColor={Colors.secondary.main}
          badge={suppliers.length}
          onPress={() => navigation.navigate("Suppliers")}
        />
        <MenuListItem
          title="All Transactions"
          subtitle="View complete transaction history"
          icon="file-text"
          iconColor={Colors.accent.success}
          badge={transactions.length}
          onPress={() => navigation.navigate("Transactions")}
        />
        <MenuListItem
          title="Upload Receipts"
          subtitle="Scan or upload PDF receipts"
          icon="upload-cloud"
          iconColor={Colors.primary.main}
          onPress={() => navigation.navigate("Receipts")}
        />

        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          System
        </ThemedText>
        <MenuListItem
          title="Settings"
          subtitle="App preferences and configuration"
          icon="settings"
          onPress={() => navigation.navigate("Settings")}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  userIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
});
