import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  trend?: { value: number; isPositive: boolean };
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = Colors.primary.main,
  trend,
  onPress,
}: MetricCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[styles.card, { backgroundColor: theme.surface }, animatedStyle]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
          <Feather name={icon as any} size={20} color={iconColor} />
        </View>
        {trend ? (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.isPositive ? Colors.badges.inStock.bg : Colors.badges.outOfStock.bg },
            ]}
          >
            <Feather
              name={trend.isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={trend.isPositive ? Colors.accent.success : Colors.accent.error}
            />
            <ThemedText
              type="caption"
              style={{ color: trend.isPositive ? Colors.accent.success : Colors.accent.error, marginLeft: 2 }}
            >
              {trend.value}%
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
        {title}
      </ThemedText>
      <ThemedText type="h3" style={styles.value}>
        {value}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {subtitle}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minWidth: 140,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  value: {
    marginTop: Spacing.xs,
  },
});
