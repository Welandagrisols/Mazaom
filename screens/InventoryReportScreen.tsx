import React, { useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { MetricCard } from "@/components/MetricCard";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency, formatDate } from "@/utils/format";
import { CATEGORIES } from "@/constants/categories";

export default function InventoryReportScreen() {
  const { theme } = useTheme();
  const { products, batches, getProductStock, getLowStockProducts } = useApp();

  const lowStockProducts = getLowStockProducts();

  const totalInventoryValue = useMemo(() => {
    return batches.reduce((sum, batch) => {
      const product = products.find((p) => p.id === batch.productId);
      if (product) {
        return sum + batch.quantity * product.costPrice;
      }
      return sum;
    }, 0);
  }, [batches, products]);

  const totalRetailValue = useMemo(() => {
    return batches.reduce((sum, batch) => {
      const product = products.find((p) => p.id === batch.productId);
      if (product) {
        return sum + batch.quantity * product.retailPrice;
      }
      return sum;
    }, 0);
  }, [batches, products]);

  const potentialProfit = totalRetailValue - totalInventoryValue;

  const expiringProducts = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return batches
      .filter((b) => {
        if (!b.expiryDate) return false;
        const expiry = new Date(b.expiryDate);
        return expiry <= thirtyDaysFromNow && expiry >= new Date();
      })
      .map((batch) => {
        const product = products.find((p) => p.id === batch.productId);
        return {
          ...batch,
          productName: product?.name || "Unknown",
          daysUntilExpiry: Math.ceil(
            (new Date(batch.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [batches, products]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; value: number }> = {};

    products.forEach((product) => {
      const stock = getProductStock(product.id);
      const value = stock * product.costPrice;

      if (!breakdown[product.category]) {
        breakdown[product.category] = { count: 0, value: 0 };
      }
      breakdown[product.category].count += stock;
      breakdown[product.category].value += value;
    });

    return Object.entries(breakdown)
      .map(([categoryId, data]) => ({
        category: CATEGORIES.find((c) => c.id === categoryId),
        ...data,
      }))
      .filter((item) => item.category)
      .sort((a, b) => b.value - a.value);
  }, [products, getProductStock]);

  return (
    <ScreenScrollView>
      <View style={styles.metricsRow}>
        <MetricCard
          title="Total Products"
          value={products.length.toString()}
          icon="package"
          iconColor={Colors.primary.main}
        />
        <View style={{ width: Spacing.md }} />
        <MetricCard
          title="Low Stock"
          value={lowStockProducts.length.toString()}
          icon="alert-triangle"
          iconColor={lowStockProducts.length > 0 ? Colors.accent.warning : Colors.accent.success}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          title="Cost Value"
          value={formatCurrency(totalInventoryValue)}
          icon="dollar-sign"
          iconColor={Colors.secondary.main}
        />
        <View style={{ width: Spacing.md }} />
        <MetricCard
          title="Potential Profit"
          value={formatCurrency(potentialProfit)}
          icon="trending-up"
          iconColor={Colors.accent.success}
        />
      </View>

      {categoryBreakdown.length > 0 ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Stock by Category
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {categoryBreakdown.map((item, index) => (
              <View
                key={item.category?.id}
                style={[
                  styles.categoryRow,
                  index < categoryBreakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
                ]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: Colors.primary.light + "20" }]}>
                  <Feather name={item.category?.icon as any} size={16} color={Colors.primary.main} />
                </View>
                <View style={styles.categoryInfo}>
                  <ThemedText type="body">{item.category?.name}</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {item.count} units
                  </ThemedText>
                </View>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {formatCurrency(item.value)}
                </ThemedText>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {lowStockProducts.length > 0 ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Low Stock Alert ({lowStockProducts.length})
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {lowStockProducts.slice(0, 5).map((product, index) => (
              <View
                key={product.id}
                style={[
                  styles.productRow,
                  index < Math.min(lowStockProducts.length, 5) - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.divider,
                  },
                ]}
              >
                <View style={styles.productInfo}>
                  <ThemedText type="body" numberOfLines={1}>
                    {product.name}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Reorder at: {product.reorderLevel}
                  </ThemedText>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: Colors.badges.lowStock.bg }]}>
                  <ThemedText type="small" style={{ color: Colors.badges.lowStock.text }}>
                    {getProductStock(product.id)} left
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {expiringProducts.length > 0 ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Expiring Soon ({expiringProducts.length})
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {expiringProducts.slice(0, 5).map((batch, index) => (
              <View
                key={batch.id}
                style={[
                  styles.productRow,
                  index < Math.min(expiringProducts.length, 5) - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.divider,
                  },
                ]}
              >
                <View style={styles.productInfo}>
                  <ThemedText type="body" numberOfLines={1}>
                    {batch.productName}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Batch: {batch.batchNumber}
                  </ThemedText>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: Colors.badges.expiringSoon.bg }]}>
                  <ThemedText type="small" style={{ color: Colors.badges.expiringSoon.text }}>
                    {batch.daysUntilExpiry} days
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
});
