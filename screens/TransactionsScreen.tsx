import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SearchBar } from "@/components/SearchBar";
import { TransactionCard } from "@/components/TransactionCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Transaction } from "@/types";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type TransactionsScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Transactions">;
};

type FilterOption = "all" | "today" | "week" | "month";

export default function TransactionsScreen({ navigation }: TransactionsScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { transactions } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    const now = new Date();
    switch (filter) {
      case "today":
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        result = result.filter((t) => new Date(t.transactionDate) >= today);
        break;
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((t) => new Date(t.transactionDate) >= weekAgo);
        break;
      case "month":
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        result = result.filter((t) => new Date(t.transactionDate) >= monthAgo);
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.transactionNumber.toLowerCase().includes(query) ||
          (t.customerName && t.customerName.toLowerCase().includes(query))
      );
    }

    return result;
  }, [transactions, filter, searchQuery]);

  const filters: { key: FilterOption; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];

  const renderItem = ({ item }: { item: Transaction }) => (
    <TransactionCard 
      transaction={item} 
      onPress={() => navigation.navigate("TransactionDetail" as any, { transactionId: item.id })} 
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transactions..."
            showBarcode={false}
          />
        </View>

        <View style={styles.filterRow}>
          {filters.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === f.key ? Colors.primary.main : theme.surface,
                  borderColor: filter === f.key ? Colors.primary.main : theme.divider,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: filter === f.key ? "#FFFFFF" : theme.text }}
              >
                {f.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="small" style={[styles.resultCount, { color: theme.textSecondary }]}>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
        </ThemedText>

        {filteredTransactions.length > 0 ? (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + Spacing.xl }]}
          />
        ) : (
          <EmptyState
            icon="file-text"
            title="No transactions found"
            description={searchQuery ? "Try a different search term" : "No transactions recorded yet"}
          />
        )}
      </View>
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
  filterRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  resultCount: {
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  list: {
    paddingBottom: Spacing.xl,
  },
});
