import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { CATEGORIES } from "@/constants/categories";

interface ProductCardProps {
  product: Product;
  stock: number;
  onPress: () => void;
  onAddToCart?: () => void;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, stock, onPress, onAddToCart, compact = false }: ProductCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const category = CATEGORIES.find((c) => c.id === product.category);
  const isLowStock = stock <= product.reorderLevel && stock > 0;
  const isOutOfStock = stock === 0;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getStockBadge = () => {
    if (isOutOfStock) {
      return { bg: Colors.badges.outOfStock.bg, text: Colors.badges.outOfStock.text, label: "Out of Stock" };
    }
    if (isLowStock) {
      return { bg: Colors.badges.lowStock.bg, text: Colors.badges.lowStock.text, label: "Low Stock" };
    }
    return { bg: Colors.badges.inStock.bg, text: Colors.badges.inStock.text, label: `${stock} in stock` };
  };

  const badge = getStockBadge();

  if (compact) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.compactCard, { backgroundColor: theme.surface }, animatedStyle]}
      >
        <View style={[styles.compactIcon, { backgroundColor: Colors.primary.light + "20" }]}>
          <Feather name={category?.icon as any || "box"} size={24} color={Colors.primary.main} />
        </View>
        <ThemedText type="small" numberOfLines={2} style={styles.compactName}>
          {product.name}
        </ThemedText>
        <ThemedText type="caption" style={{ color: Colors.primary.main }}>
          {formatCurrency(product.retailPrice)}
        </ThemedText>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, { backgroundColor: theme.surface }, animatedStyle]}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.primary.light + "20" }]}>
          <Feather name={category?.icon as any || "box"} size={28} color={Colors.primary.main} />
        </View>
        <View style={styles.info}>
          <ThemedText type="body" numberOfLines={1} style={styles.productName}>
            {product.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {product.sku} | {category?.name}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText type="h4" style={{ color: Colors.primary.main }}>
              {formatCurrency(product.retailPrice)}
            </ThemedText>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <ThemedText type="caption" style={{ color: badge.text }}>
                {badge.label}
              </ThemedText>
            </View>
          </View>
        </View>
        {onAddToCart && !isOutOfStock ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: Colors.primary.main, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  productName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  compactCard: {
    width: 100,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  compactIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  compactName: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
});
