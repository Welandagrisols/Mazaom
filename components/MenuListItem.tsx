import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface MenuListItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  onPress: () => void;
  showChevron?: boolean;
  badge?: string | number;
  destructive?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MenuListItem({
  title,
  subtitle,
  icon,
  iconColor = Colors.primary.main,
  onPress,
  showChevron = true,
  badge,
  destructive = false,
}: MenuListItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const effectiveIconColor = destructive ? Colors.accent.error : iconColor;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, { backgroundColor: theme.surface }, animatedStyle]}
    >
      <View style={[styles.iconContainer, { backgroundColor: effectiveIconColor + "20" }]}>
        <Feather name={icon as any} size={20} color={effectiveIconColor} />
      </View>
      <View style={styles.content}>
        <ThemedText
          type="body"
          style={[styles.title, destructive && { color: Colors.accent.error }]}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: Colors.primary.main }]}>
          <ThemedText type="caption" style={{ color: "#FFFFFF" }}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
});
