import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Transaction } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { PAYMENT_METHODS } from "@/constants/categories";

interface TransactionCardProps {
  transaction: Transaction;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === transaction.paymentMethod);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getStatusColor = () => {
    switch (transaction.paymentStatus) {
      case "completed":
        return Colors.accent.success;
      case "pending":
        return Colors.accent.warning;
      case "refunded":
        return Colors.accent.error;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, { backgroundColor: theme.surface }, animatedStyle]}
    >
      <View style={styles.header}>
        <View>
          <ThemedText type="body" style={styles.transactionNumber}>
            {transaction.transactionNumber}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatDateTime(transaction.transactionDate)}
          </ThemedText>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <ThemedText type="h4" style={{ color: Colors.primary.main }}>
            {formatCurrency(transaction.total)}
          </ThemedText>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.paymentInfo}>
          <Feather
            name={paymentMethod?.icon as any || "credit-card"}
            size={14}
            color={theme.textSecondary}
          />
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
            {paymentMethod?.name || transaction.paymentMethod}
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {transaction.items.length} item{transaction.items.length !== 1 ? "s" : ""}
        </ThemedText>
        {transaction.customerName ? (
          <View style={styles.customerInfo}>
            <Feather name="user" size={12} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
              {transaction.customerName}
            </ThemedText>
          </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  transactionNumber: {
    fontWeight: "600",
    marginBottom: 2,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
});
