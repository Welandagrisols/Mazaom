import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
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
  gridView?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, stock, onPress, onAddToCart, compact = false, gridView = false }: ProductCardProps) {
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

  if (gridView) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.gridCard, { backgroundColor: theme.surface }, animatedStyle]}
      >
        <View style={[styles.gridImageContainer, { backgroundColor: Colors.primary.light + "10" }]}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.gridImage} />
          ) : (
            <Feather name={category?.icon as any || "box"} size={40} color={Colors.primary.main} />
          )}
          {!isOutOfStock && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart?.();
              }}
              style={({ pressed }) => [
                styles.gridAddButton,
                { backgroundColor: Colors.primary.main, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
        <View style={styles.gridInfo}>
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 2 }}>
            {stock} {product.unit}
          </ThemedText>
          <ThemedText type="small" numberOfLines={2} style={styles.gridProductName}>
            {product.name}
          </ThemedText>
          <ThemedText type="body" style={{ color: Colors.primary.main, fontWeight: "600", marginTop: 4 }}>
            {formatCurrency(product.retailPrice)}
          </ThemedText>
        </View>
      </AnimatedPressable>
    );
  }

  if (compact) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.compactCard, { backgroundColor: theme.surface }, animatedStyle]}
      >
        <View style={[styles.compactIcon, { backgroundColor: Colors.primary.light + "20" }]}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.compactImage} />
          ) : (
            <Feather name={category?.icon as any || "box"} size={24} color={Colors.primary.main} />
          )}
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
        <View style={[styles.iconContainer, { backgroundColor: Colors.primary.light + "20", overflow: 'hidden' }]}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.productImage} />
          ) : (
            <Feather name={category?.icon as any || "box"} size={28} color={Colors.primary.main} />
          )}
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
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  compactImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridCard: {
    flex: 1,
    margin: 6,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    maxWidth: "48%",
  },
  gridImageContainer: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridAddButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gridInfo: {
    padding: Spacing.md,
  },
  gridProductName: {
    fontWeight: "500",
    lineHeight: 18,
  },
});
