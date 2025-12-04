import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency, formatDate } from "@/utils/format";
import { CATEGORIES, UNITS } from "@/constants/categories";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";

type ProductDetailScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "ProductDetail">;
  route: RouteProp<InventoryStackParamList, "ProductDetail">;
};

export default function ProductDetailScreen({ route }: ProductDetailScreenProps) {
  const { theme } = useTheme();
  const { products, batches, getProductStock, addToCart } = useApp();

  const product = useMemo(() => {
    return products.find((p) => p.id === route.params.productId);
  }, [products, route.params.productId]);

  const productBatches = useMemo(() => {
    return batches.filter((b) => b.productId === route.params.productId);
  }, [batches, route.params.productId]);

  const stock = product ? getProductStock(product.id) : 0;
  const category = CATEGORIES.find((c) => c.id === product?.category);
  const unit = UNITS.find((u) => u.id === product?.unit);

  const isLowStock = product && stock <= product.reorderLevel && stock > 0;
  const isOutOfStock = stock === 0;

  if (!product) {
    return (
      <ScreenScrollView>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h4" style={{ marginTop: Spacing.md }}>
            Product not found
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const getStockBadge = () => {
    if (isOutOfStock) {
      return { bg: Colors.badges.outOfStock.bg, text: Colors.badges.outOfStock.text, label: "Out of Stock" };
    }
    if (isLowStock) {
      return { bg: Colors.badges.lowStock.bg, text: Colors.badges.lowStock.text, label: "Low Stock" };
    }
    return { bg: Colors.badges.inStock.bg, text: Colors.badges.inStock.text, label: "In Stock" };
  };

  const badge = getStockBadge();

  return (
    <ScreenScrollView>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.primary.light + "20" }]}>
          <Feather name={category?.icon as any || "box"} size={48} color={Colors.primary.main} />
        </View>
        <ThemedText type="h3" style={styles.productName}>
          {product.name}
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {product.sku} | {category?.name}
        </ThemedText>
        <View style={[styles.stockBadge, { backgroundColor: badge.bg }]}>
          <ThemedText type="small" style={{ color: badge.text }}>
            {badge.label} - {stock} {unit?.abbr}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Pricing
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Retail Price
              </ThemedText>
              <ThemedText type="h4" style={{ color: Colors.primary.main }}>
                {formatCurrency(product.retailPrice)}
              </ThemedText>
            </View>
            <View style={styles.priceItem}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Wholesale Price
              </ThemedText>
              <ThemedText type="h4" style={{ color: Colors.secondary.main }}>
                {formatCurrency(product.wholesalePrice)}
              </ThemedText>
            </View>
            <View style={styles.priceItem}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Cost Price
              </ThemedText>
              <ThemedText type="h4">{formatCurrency(product.costPrice)}</ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.marginRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Profit Margin (Retail)
            </ThemedText>
            <ThemedText type="body" style={{ color: Colors.accent.success, fontWeight: "600" }}>
              {Math.round(((product.retailPrice - product.costPrice) / product.costPrice) * 100)}%
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Product Details
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.detailRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Category
            </ThemedText>
            <ThemedText type="body">{category?.name}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Unit
            </ThemedText>
            <ThemedText type="body">{unit?.name}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Reorder Level
            </ThemedText>
            <ThemedText type="body">
              {product.reorderLevel} {unit?.abbr}
            </ThemedText>
          </View>
          {product.barcode ? (
            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Barcode
              </ThemedText>
              <ThemedText type="body">{product.barcode}</ThemedText>
            </View>
          ) : null}
          {product.description ? (
            <View style={styles.descriptionRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Description
              </ThemedText>
              <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                {product.description}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      {productBatches.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Stock Batches ({productBatches.length})
          </ThemedText>
          {productBatches.map((batch) => (
            <View key={batch.id} style={[styles.batchCard, { backgroundColor: theme.surface }]}>
              <View style={styles.batchHeader}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {batch.batchNumber}
                </ThemedText>
                <ThemedText type="body" style={{ color: Colors.primary.main, fontWeight: "600" }}>
                  {batch.quantity} {unit?.abbr}
                </ThemedText>
              </View>
              <View style={styles.batchDetails}>
                <View style={styles.batchDetail}>
                  <Feather name="calendar" size={12} color={theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                    Purchased: {formatDate(batch.purchaseDate)}
                  </ThemedText>
                </View>
                {batch.expiryDate ? (
                  <View style={styles.batchDetail}>
                    <Feather name="clock" size={12} color={theme.textSecondary} />
                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                      Expires: {formatDate(batch.expiryDate)}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        onPress={() => addToCart(product)}
        icon="shopping-cart"
        disabled={isOutOfStock}
        style={styles.addToCartButton}
      >
        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  productName: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  stockBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceItem: {
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  marginRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  descriptionRow: {
    paddingVertical: Spacing.sm,
  },
  batchCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  batchDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  batchDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  addToCartButton: {
    marginBottom: Spacing.xl,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
});
