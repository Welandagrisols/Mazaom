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
import { formatPhone } from "@/utils/format";
import { Supplier } from "@/types";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type SuppliersScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Suppliers">;
};

export default function SuppliersScreen({ navigation }: SuppliersScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { suppliers } = useApp();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const query = searchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.contactPerson.toLowerCase().includes(query) ||
        s.phone.includes(searchQuery)
    );
  }, [suppliers, searchQuery]);

  const renderItem = ({ item }: { item: Supplier }) => (
    <Pressable
      style={({ pressed }) => [
        styles.supplierCard,
        { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: Colors.secondary.light + "20" }]}>
        <Feather name="truck" size={24} color={Colors.secondary.main} />
      </View>
      <View style={styles.supplierInfo}>
        <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {item.contactPerson} | {formatPhone(item.phone)}
        </ThemedText>
        {item.paymentTerms ? (
          <ThemedText type="caption" style={{ color: Colors.primary.main }}>
            {item.paymentTerms}
          </ThemedText>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search suppliers..."
            showBarcode={false}
          />
        </View>

        {filteredSuppliers.length > 0 ? (
          <FlatList
            data={filteredSuppliers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + Spacing.xl + 80 }]}
          />
        ) : (
          <EmptyState
            icon="truck"
            title="No suppliers found"
            description={searchQuery ? "Try a different search term" : "Add your first supplier to get started"}
            actionLabel="Add Supplier"
            onAction={() => navigation.navigate("AddSupplier")}
          />
        )}
      </View>

      <Pressable
        onPress={() => navigation.navigate("AddSupplier")}
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
  supplierCard: {
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
  supplierInfo: {
    flex: 1,
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
