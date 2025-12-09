import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, Alert, TextInput, Pressable } from "react-native";
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

export default function ProductDetailScreen({ route, navigation }: ProductDetailScreenProps) {
  const { productId } = route.params;
  const { theme } = useTheme();
  const { products, batches, getProductStock, addToCart, addStockEntry } = useApp();
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockCostPrice, setStockCostPrice] = useState("");
  const [isAddingStock, setIsAddingStock] = useState(false);

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

  const handleAddStock = useCallback(async () => {
    if (!stockQuantity || parseFloat(stockQuantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity.");
      return;
    }
    if (!stockCostPrice || parseFloat(stockCostPrice) <= 0) {
      Alert.alert("Error", "Please enter a valid cost price.");
      return;
    }

    try {
      setIsAddingStock(true);
      const result = await addStockEntry(
        product.id,
        parseFloat(stockQuantity),
        parseFloat(stockCostPrice)
      );

      if (result) {
        const message = result.merged
          ? `Added ${stockQuantity} ${unit?.abbr} to existing batch (same cost price)`
          : `Created new batch with ${stockQuantity} ${unit?.abbr} (different cost price)`;
        Alert.alert("Success", message);
        setStockQuantity("");
        setStockCostPrice("");
      } else {
        Alert.alert("Error", "Failed to add stock. Please try again.");
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      Alert.alert("Error", "Failed to add stock. Please try again.");
    } finally {
      setIsAddingStock(false);
    }
  }, [stockQuantity, stockCostPrice, product, addStockEntry, unit]);

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
      <Pressable
        onPress={() => navigation.navigate("AddOrRestock")}
        style={[styles.editButton, { backgroundColor: Colors.primary.main }]}
      >
        <Feather name="edit" size={20} color="#FFFFFF" />
      </Pressable>

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

      <View style={[styles.stockAdjustment, { backgroundColor: theme.surface }]}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Add Stock
        </ThemedText>
        <View style={styles.stockInputRow}>
          <View style={[styles.stockInput, { flex: 1, marginRight: Spacing.sm, borderColor: theme.divider }]}>
            <Feather name="package" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.stockInputField, { color: theme.text }]}
              placeholder="Quantity"
              keyboardType="number-pad"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
          <View style={[styles.stockInput, { flex: 1, borderColor: theme.divider }]}>
            <Feather name="dollar-sign" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.stockInputField, { color: theme.text }]}
              placeholder="Cost Price"
              keyboardType="numeric"
              value={stockCostPrice}
              onChangeText={setStockCostPrice}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>
        <Button
          onPress={handleAddStock}
          icon="plus"
          loading={isAddingStock}
          style={{ marginTop: Spacing.md }}
        >
          Add Stock
        </Button>
      </View>

      <Button
        onPress={() => {
          try {
            addToCart(product);
            Alert.alert("Success", "Product added to cart");
          } catch (error) {
            console.error("Error adding to cart:", error);
            Alert.alert("Error", "Failed to add product to cart");
          }
        }}
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
  editButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
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
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  stockAdjustment: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  stockInputRow: {
    flexDirection: "row",
  },
  stockInput: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  stockInputField: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
});