import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, Modal, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  FadeIn,
  FadeOut
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

interface ActionDropdownProps {
  actions: ActionMenuItem[];
}

export function ActionDropdown({ actions }: ActionDropdownProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);

  const handleOpen = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonPosition({ x, y, width, height });
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAction = (action: ActionMenuItem) => {
    handleClose();
    setTimeout(() => action.onPress(), 100);
  };

  const screenWidth = Dimensions.get("window").width;
  const menuWidth = 180;
  const menuLeft = Math.min(buttonPosition.x, screenWidth - menuWidth - 16);

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [
            styles.triggerButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="more-vertical" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={[
              styles.menu,
              {
                backgroundColor: theme.surface,
                top: buttonPosition.y + buttonPosition.height + 4,
                left: menuLeft,
                width: menuWidth,
                ...Shadows.medium,
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                Actions
              </ThemedText>
            </View>
            {actions.map((action, index) => (
              <Pressable
                key={action.id}
                onPress={() => handleAction(action)}
                style={({ pressed }) => [
                  styles.menuItem,
                  index === actions.length - 1 && styles.menuItemLast,
                  { backgroundColor: pressed ? theme.backgroundSecondary : "transparent" }
                ]}
              >
                <Feather 
                  name={action.icon as any} 
                  size={16} 
                  color={action.color || theme.text} 
                  style={styles.menuItemIcon}
                />
                <ThemedText 
                  type="small" 
                  style={{ color: action.color || theme.text }}
                >
                  {action.label}
                </ThemedText>
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  menu: {
    position: "absolute",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  menuHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    marginRight: Spacing.sm,
  },
});
