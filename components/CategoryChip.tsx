import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface CategoryChipProps {
  id: string;
  name: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryChip({ name, icon, isSelected, onPress }: CategoryChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? Colors.primary.main : theme.surface,
          borderColor: isSelected ? Colors.primary.main : theme.divider,
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={icon as any}
        size={16}
        color={isSelected ? "#FFFFFF" : Colors.primary.main}
        style={styles.icon}
      />
      <ThemedText
        type="small"
        style={[styles.label, { color: isSelected ? "#FFFFFF" : theme.text }]}
      >
        {name}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: "500",
  },
});
