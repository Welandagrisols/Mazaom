import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency, formatPhone } from "@/utils/format";
import { Customer } from "@/types";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type CustomersScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Customers">;
};

export default function CustomersScreen({ navigation }: CustomersScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { customers } = useApp();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  }, [customers, searchQuery]);

  const getTypeBadge = (type: Customer["customerType"]) => {
    switch (type) {
      case "vip":
        return { bg: Colors.badges.inStock.bg, text: Colors.badges.inStock.text, label: "VIP" };
      case "wholesale":
        return { bg: Colors.secondary.light + "30", text: Colors.secondary.main, label: "Wholesale" };
      default:
        return { bg: theme.backgroundSecondary, text: theme.textSecondary, label: "Retail" };
    }
  };

  const renderItem = ({ item }: { item: Customer }) => {
    const badge = getTypeBadge(item.customerType);

    return (
      <Pressable
        onPress={() => navigation.navigate("CustomerCredits")}
        style={({ pressed }) => [
          styles.customerCard,
          { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: Colors.primary.light + "20" }]}>
          <ThemedText type="h4" style={{ color: Colors.primary.main }}>
            {item.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.customerInfo}>
          <View style={styles.customerHeader}>
            <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
              <ThemedText type="caption" style={{ color: badge.text }}>
                {badge.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatPhone(item.phone)}
          </ThemedText>
          {item.currentBalance > 0 ? (
            <ThemedText type="small" style={{ color: Colors.accent.warning }}>
              Outstanding: {formatCurrency(item.currentBalance)}
            </ThemedText>
          ) : null}
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search customers..."
            showBarcode={false}
          />
        </View>

        {filteredCustomers.length > 0 ? (
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + Spacing.xl + 80 }]}
          />
        ) : (
          <EmptyState
            icon="users"
            title="No customers found"
            description={searchQuery ? "Try a different search term" : "Add your first customer to get started"}
            actionLabel="Add Customer"
            onAction={() => navigation.navigate("AddCustomer")}
          />
        )}
      </View>

      <Pressable
        onPress={() => navigation.navigate("AddCustomer")}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: Colors.primary.main,
            bottom: tabBarHeight + Spacing.xl,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  searchSection: {
    marginBottom: Spacing.md,
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  typeBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
