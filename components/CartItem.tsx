import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { CartItem as CartItemType } from "@/types";
import { formatCurrency } from "@/utils/format";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function CartItemComponent({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { theme } = useTheme();
  const itemTotal = item.unitPrice * item.quantity - item.discount;

  return (
    <AnimatedView
      entering={SlideInRight.springify()}
      exiting={SlideOutLeft.springify()}
      style={[styles.container, { backgroundColor: theme.surface }]}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <ThemedText type="body" numberOfLines={1} style={styles.name}>
            {item.product.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatCurrency(item.unitPrice)} each
          </ThemedText>
        </View>
        <View style={styles.quantityContainer}>
          <Pressable
            onPress={() => onUpdateQuantity(item.quantity - 1)}
            style={({ pressed }) => [
              styles.quantityButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="minus" size={16} color={theme.text} />
          </Pressable>
          <ThemedText type="body" style={styles.quantity}>
            {item.quantity}
          </ThemedText>
          <Pressable
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            style={({ pressed }) => [
              styles.quantityButton,
              { backgroundColor: Colors.primary.main, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.totalContainer}>
          <ThemedText type="body" style={{ color: Colors.primary.main, fontWeight: "600" }}>
            {formatCurrency(itemTotal)}
          </ThemedText>
          <Pressable
            onPress={onRemove}
            style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="trash-2" size={16} color={Colors.accent.error} />
          </Pressable>
        </View>
      </View>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontWeight: "500",
    marginBottom: 2,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    minWidth: 32,
    textAlign: "center",
    fontWeight: "600",
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  removeButton: {
    padding: Spacing.xs,
    marginTop: Spacing.xs,
  },
});
