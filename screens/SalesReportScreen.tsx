import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { TransactionCard } from "@/components/TransactionCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency, formatDate } from "@/utils/format";

type Period = "today" | "week" | "month" | "all";

export default function SalesReportScreen() {
  const { theme } = useTheme();
  const { transactions } = useApp();

  const [period, setPeriod] = useState<Period>("today");

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "all":
      default:
        return transactions;
    }

    return transactions.filter((t) => new Date(t.transactionDate) >= startDate);
  }, [transactions, period]);

  const summary = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = filteredTransactions.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalItems = filteredTransactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    return { totalSales, totalTransactions, averageTransaction, totalItems };
  }, [filteredTransactions]);

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
  ];

  return (
    <ScreenScrollView>
      <View style={styles.periodSelector}>
        {periods.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[
              styles.periodButton,
              {
                backgroundColor: period === p.key ? Colors.primary.main : theme.surface,
                borderColor: period === p.key ? Colors.primary.main : theme.divider,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: period === p.key ? "#FFFFFF" : theme.text, fontWeight: "500" }}
            >
              {p.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.summaryCard, { backgroundColor: Colors.primary.main }]}>
        <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.8)" }}>
          Total Sales
        </ThemedText>
        <ThemedText type="h1" style={styles.summaryValue}>
          {formatCurrency(summary.totalSales)}
        </ThemedText>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Feather name="shopping-cart" size={16} color="rgba(255,255,255,0.8)" />
            <ThemedText type="small" style={styles.summaryItemText}>
              {summary.totalTransactions} transactions
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <Feather name="package" size={16} color="rgba(255,255,255,0.8)" />
            <ThemedText type="small" style={styles.summaryItemText}>
              {summary.totalItems} items sold
            </ThemedText>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
        <View style={styles.averageRow}>
          <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
            Avg. Transaction Value
          </ThemedText>
          <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
            {formatCurrency(summary.averageTransaction)}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>
        Transactions ({filteredTransactions.length})
      </ThemedText>

      {filteredTransactions.length > 0 ? (
        filteredTransactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onPress={() => {}}
          />
        ))
      ) : (
        <EmptyState
          icon="file-text"
          title="No transactions"
          description={`No sales recorded for this ${period === "today" ? "day" : period}`}
        />
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  periodSelector: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  summaryValue: {
    color: "#FFFFFF",
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItemText: {
    color: "rgba(255,255,255,0.9)",
    marginLeft: Spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  averageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
});
