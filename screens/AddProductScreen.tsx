import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, ScrollView, Alert, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { CATEGORIES, UNITS } from "@/constants/categories";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";

type AddProductScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "AddProduct">;
};

export default function AddProductScreen({ navigation }: AddProductScreenProps) {
  const { theme } = useTheme();
  const { addProduct } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [unit, setUnit] = useState(UNITS[0].id);
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }
    if (!sku.trim()) {
      Alert.alert("Error", "Please enter a SKU");
      return;
    }
    if (!retailPrice || parseFloat(retailPrice) <= 0) {
      Alert.alert("Error", "Please enter a valid retail price");
      return;
    }

    setIsLoading(true);
    try {
      const success = await addProduct({
        name: name.trim(),
        description: description.trim(),
        sku: sku.trim().toUpperCase(),
        category: category as any,
        unit: unit as any,
        retailPrice: parseFloat(retailPrice),
        wholesalePrice: parseFloat(wholesalePrice) || parseFloat(retailPrice) * 0.9,
        costPrice: parseFloat(costPrice) || parseFloat(retailPrice) * 0.7,
        reorderLevel: parseInt(reorderLevel) || 10,
        active: true,
      });

      if (success) {
        Alert.alert("Success", "Product added successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", "Failed to add product. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, description, sku, category, unit, retailPrice, wholesalePrice, costPrice, reorderLevel, addProduct, navigation]);

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: { placeholder?: string; keyboardType?: "default" | "numeric"; multiline?: boolean }
  ) => (
    <View style={styles.inputGroup}>
      <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.multilineInput,
          { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={options?.placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={options?.keyboardType || "default"}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <ScreenKeyboardAwareScrollView>
      {renderInput("Product Name *", name, setName, { placeholder: "e.g., Dairy Meal 70kg" })}
      {renderInput("Description", description, setDescription, {
        placeholder: "Product description",
        multiline: true,
      })}
      {renderInput("SKU *", sku, setSku, { placeholder: "e.g., FM-001" })}

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Category
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: category === cat.id ? Colors.primary.main : theme.surface,
                  borderColor: category === cat.id ? Colors.primary.main : theme.divider,
                },
              ]}
            >
              <Feather
                name={cat.icon as any}
                size={14}
                color={category === cat.id ? "#FFFFFF" : Colors.primary.main}
              />
              <ThemedText
                type="caption"
                style={{ color: category === cat.id ? "#FFFFFF" : theme.text, marginLeft: 4 }}
              >
                {cat.name}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Unit of Measure
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {UNITS.map((u) => (
            <Pressable
              key={u.id}
              onPress={() => setUnit(u.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: unit === u.id ? Colors.primary.main : theme.surface,
                  borderColor: unit === u.id ? Colors.primary.main : theme.divider,
                },
              ]}
            >
              <ThemedText
                type="caption"
                style={{ color: unit === u.id ? "#FFFFFF" : theme.text }}
              >
                {u.name}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Retail Price *
          </ThemedText>
          <View style={[styles.priceInput, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              KES
            </ThemedText>
            <TextInput
              style={[styles.priceInputField, { color: theme.text }]}
              value={retailPrice}
              onChangeText={setRetailPrice}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Wholesale Price
          </ThemedText>
          <View style={[styles.priceInput, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              KES
            </ThemedText>
            <TextInput
              style={[styles.priceInputField, { color: theme.text }]}
              value={wholesalePrice}
              onChangeText={setWholesalePrice}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Cost Price
          </ThemedText>
          <View style={[styles.priceInput, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              KES
            </ThemedText>
            <TextInput
              style={[styles.priceInputField, { color: theme.text }]}
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
          <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
            Reorder Level
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text },
            ]}
            value={reorderLevel}
            onChangeText={setReorderLevel}
            placeholder="10"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Button onPress={handleSubmit} loading={isLoading} icon="plus" style={styles.submitButton}>
        Add Product
      </Button>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  chipScroll: {
    paddingRight: Spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  row: {
    flexDirection: "row",
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  priceInputField: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
