import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "text";
  icon?: string;
  loading?: boolean;
  size?: "small" | "medium" | "large";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  icon,
  loading = false,
  size = "medium",
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getBackgroundColor = () => {
    if (variant === "primary") return Colors.primary.main;
    if (variant === "secondary") return Colors.secondary.main;
    if (variant === "outline") return "transparent";
    return "transparent";
  };

  const getTextColor = () => {
    if (variant === "primary" || variant === "secondary") return "#FFFFFF";
    return Colors.primary.main;
  };

  const getBorderStyle = () => {
    if (variant === "outline") {
      return { borderWidth: 1, borderColor: Colors.primary.main };
    }
    return {};
  };

  const getHeight = () => {
    switch (size) {
      case "small":
        return 36;
      case "large":
        return 56;
      default:
        return Spacing.buttonHeight;
    }
  };

  const textColor = getTextColor();

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          opacity: disabled ? 0.5 : 1,
          ...getBorderStyle(),
        },
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? (
            <Feather
              name={icon as any}
              size={size === "small" ? 16 : 20}
              color={textColor}
              style={styles.icon}
            />
          ) : null}
          <ThemedText
            type={size === "small" ? "small" : "body"}
            style={[styles.buttonText, { color: textColor }]}
          >
            {children}
          </ThemedText>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    fontWeight: "600",
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
