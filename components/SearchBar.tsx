import React from "react";
import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onBarcodePress?: () => void;
  showBarcode?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search products...",
  onBarcodePress,
  showBarcode = true,
}: SearchBarProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Feather name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
      />
      {showBarcode && onBarcodePress ? (
        <Pressable
          onPress={onBarcodePress}
          style={({ pressed }) => [
            styles.barcodeButton,
            { backgroundColor: Colors.primary.main, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="camera" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  barcodeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
});
