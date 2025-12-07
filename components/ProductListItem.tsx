import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Product } from "@/types";
import { formatCurrency } from "@/utils/format";

interface ProductListItemProps {
  product: Product;
  stock: number;
  onPress: () => void;
}

export function ProductListItem({ product, stock, onPress }: ProductListItemProps) {
  const { theme } = useTheme();
  
  const isLowStock = stock <= product.reorderLevel && stock > 0;
  const isOutOfStock = stock === 0;

  const getStockColor = () => {
    if (isOutOfStock) return Colors.accent.error;
    if (isLowStock) return Colors.accent.warning;
    return Colors.primary.main;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isOutOfStock}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: theme.surface,
          opacity: isOutOfStock ? 0.6 : pressed ? 0.8 : 1 
        },
      ]}
    >
      <View style={styles.mainInfo}>
        <ThemedText type="body" style={styles.productName} numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          SKU: {product.sku}
        </ThemedText>
      </View>
      
      <View style={styles.stockInfo}>
        <ThemedText type="caption" style={{ color: getStockColor(), fontWeight: "600" }}>
          {isOutOfStock ? "Out of Stock" : `${stock} ${product.unit}`}
        </ThemedText>
      </View>
      
      <View style={styles.priceInfo}>
        <ThemedText type="body" style={{ color: Colors.primary.main, fontWeight: "700" }}>
          {formatCurrency(product.retailPrice)}
        </ThemedText>
      </View>
      
      {!isOutOfStock && (
        <View style={[styles.addIcon, { backgroundColor: Colors.primary.light + "20" }]}>
          <Feather name="plus" size={18} color={Colors.primary.main} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  mainInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  productName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  stockInfo: {
    width: 80,
    alignItems: "center",
  },
  priceInfo: {
    width: 90,
    alignItems: "flex-end",
    marginRight: Spacing.md,
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
