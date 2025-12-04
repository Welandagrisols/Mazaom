import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { MetricCard } from "@/components/MetricCard";
import { MenuListItem } from "@/components/MenuListItem";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, Colors } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { ReportsStackParamList } from "@/navigation/ReportsStackNavigator";

type ReportsScreenProps = {
  navigation: NativeStackNavigationProp<ReportsStackParamList, "Reports">;
};

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { transactions, products, getLowStockProducts, getTodaySales, getTodayTransactionCount, batches } = useApp();

  const todaySales = getTodaySales();
  const todayTransactions = getTodayTransactionCount();
  const lowStockCount = getLowStockProducts().length;

  const weekSales = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return transactions
      .filter((t) => new Date(t.transactionDate) >= oneWeekAgo)
      .reduce((sum, t) => sum + t.total, 0);
  }, [transactions]);

  const monthSales = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return transactions
      .filter((t) => new Date(t.transactionDate) >= oneMonthAgo)
      .reduce((sum, t) => sum + t.total, 0);
  }, [transactions]);

  const totalInventoryValue = useMemo(() => {
    return batches.reduce((sum, batch) => {
      const product = products.find((p) => p.id === batch.productId);
      if (product) {
        return sum + batch.quantity * product.costPrice;
      }
      return sum;
    }, 0);
  }, [batches, products]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, number> = {};
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      });
    });
    return Object.entries(productSales)
      .map(([productId, quantity]) => ({
        productId,
        name: products.find((p) => p.id === productId)?.name || "Unknown",
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [transactions, products]);

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
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Today's Overview
        </ThemedText>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Today's Sales"
            value={formatCurrency(todaySales)}
            icon="dollar-sign"
            iconColor={Colors.primary.main}
          />
          <View style={{ width: Spacing.md }} />
          <MetricCard
            title="Transactions"
            value={todayTransactions.toString()}
            icon="shopping-cart"
            iconColor={Colors.secondary.main}
          />
        </View>

        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Performance Summary
        </ThemedText>
        <View style={styles.metricsRow}>
          <MetricCard
            title="This Week"
            value={formatCurrency(weekSales)}
            icon="calendar"
            iconColor={Colors.primary.main}
          />
          <View style={{ width: Spacing.md }} />
          <MetricCard
            title="This Month"
            value={formatCurrency(monthSales)}
            icon="trending-up"
            iconColor={Colors.accent.success}
          />
        </View>

        <View style={styles.metricsRow}>
          <MetricCard
            title="Low Stock Items"
            value={lowStockCount.toString()}
            icon="alert-triangle"
            iconColor={lowStockCount > 0 ? Colors.accent.warning : Colors.accent.success}
          />
          <View style={{ width: Spacing.md }} />
          <MetricCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            icon="package"
            iconColor={Colors.secondary.main}
          />
        </View>

        {topProducts.length > 0 ? (
          <>
            <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Top Selling Products
            </ThemedText>
            <View style={[styles.topProductsCard, { backgroundColor: theme.surface }]}>
              {topProducts.map((product, index) => (
                <View
                  key={product.productId}
                  style={[
                    styles.topProductRow,
                    index < topProducts.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
                  ]}
                >
                  <View style={styles.rankBadge}>
                    <ThemedText type="caption" style={{ color: Colors.primary.main, fontWeight: "700" }}>
                      #{index + 1}
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={{ flex: 1 }} numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {product.quantity} sold
                  </ThemedText>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Detailed Reports
        </ThemedText>
        <MenuListItem
          title="Sales Report"
          subtitle="Daily, weekly, monthly sales breakdown"
          icon="bar-chart-2"
          iconColor={Colors.primary.main}
          onPress={() => navigation.navigate("SalesReport")}
        />
        <MenuListItem
          title="Inventory Report"
          subtitle="Stock levels, expiry tracking, valuation"
          icon="package"
          iconColor={Colors.secondary.main}
          onPress={() => navigation.navigate("InventoryReport")}
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
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  topProductsCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topProductRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.light + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
});
