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
import { ItemType } from "@/types";

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
  const [itemType, setItemType] = useState<ItemType>("unit");
  const [packageWeight, setPackageWeight] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [costPerKg, setCostPerKg] = useState("");
  const [bulkUnit, setBulkUnit] = useState("kg");

  const BULK_UNITS = [
    { id: "kg", name: "Kilograms (kg)" },
    { id: "liters", name: "Liters (L)" },
    { id: "grams", name: "Grams (g)" },
    { id: "ml", name: "Milliliters (ml)" },
  ];

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
    if (itemType === "bulk") {
      if (!packageWeight || parseFloat(packageWeight) <= 0) {
        Alert.alert("Error", "Please enter the package weight/volume for bulk items");
        return;
      }
      if (!pricePerKg || parseFloat(pricePerKg) <= 0) {
        Alert.alert("Error", "Please enter the price per unit (kg/liter) for bulk items");
        return;
      }
    }

    setIsLoading(true);
    try {
      const productData: Parameters<typeof addProduct>[0] = {
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
        itemType,
      };

      if (itemType === "bulk") {
        productData.isBulkItem = true;
        productData.packageWeight = parseFloat(packageWeight);
        productData.pricePerKg = parseFloat(pricePerKg);
        productData.costPerKg = parseFloat(costPerKg) || parseFloat(pricePerKg) * 0.7;
        productData.bulkUnit = bulkUnit;
      }

      const success = await addProduct(productData);

      if (success) {
        Alert.alert("Success", "Product added successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", "Failed to add product. Please try again.");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, description, sku, category, unit, retailPrice, wholesalePrice, costPrice, reorderLevel, itemType, packageWeight, pricePerKg, costPerKg, bulkUnit, addProduct, navigation]);

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
          Item Type *
        </ThemedText>
        <View style={styles.itemTypeContainer}>
          <Pressable
            onPress={() => setItemType("unit")}
            style={[
              styles.itemTypeOption,
              {
                backgroundColor: itemType === "unit" ? Colors.primary.main : theme.surface,
                borderColor: itemType === "unit" ? Colors.primary.main : theme.divider,
              },
            ]}
          >
            <Feather
              name="box"
              size={20}
              color={itemType === "unit" ? "#FFFFFF" : Colors.primary.main}
            />
            <View style={styles.itemTypeText}>
              <ThemedText
                type="body"
                style={{ color: itemType === "unit" ? "#FFFFFF" : theme.text, fontWeight: "600" }}
              >
                Unit/Countable
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: itemType === "unit" ? "#FFFFFF" : theme.textSecondary }}
              >
                Sold as whole units only
              </ThemedText>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setItemType("bulk")}
            style={[
              styles.itemTypeOption,
              {
                backgroundColor: itemType === "bulk" ? Colors.primary.main : theme.surface,
                borderColor: itemType === "bulk" ? Colors.primary.main : theme.divider,
              },
            ]}
          >
            <Feather
              name="layers"
              size={20}
              color={itemType === "bulk" ? "#FFFFFF" : Colors.primary.main}
            />
            <View style={styles.itemTypeText}>
              <ThemedText
                type="body"
                style={{ color: itemType === "bulk" ? "#FFFFFF" : theme.text, fontWeight: "600" }}
              >
                Bulk/Divisible
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: itemType === "bulk" ? "#FFFFFF" : theme.textSecondary }}
              >
                Can sell by weight/volume
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>

      {itemType === "bulk" && (
        <>
          <View style={[styles.bulkSection, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            <View style={styles.bulkHeader}>
              <Feather name="info" size={16} color={Colors.primary.main} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs, flex: 1 }}>
                Configure how this item is divided and sold
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                Bulk Unit
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScroll}
              >
                {BULK_UNITS.map((u) => (
                  <Pressable
                    key={u.id}
                    onPress={() => setBulkUnit(u.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: bulkUnit === u.id ? Colors.primary.main : theme.backgroundSecondary,
                        borderColor: bulkUnit === u.id ? Colors.primary.main : theme.divider,
                      },
                    ]}
                  >
                    <ThemedText
                      type="caption"
                      style={{ color: bulkUnit === u.id ? "#FFFFFF" : theme.text }}
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
                  Package Size *
                </ThemedText>
                <View style={[styles.priceInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
                  <TextInput
                    style={[styles.priceInputField, { color: theme.text }]}
                    value={packageWeight}
                    onChangeText={setPackageWeight}
                    placeholder="70"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    {bulkUnit}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Price per {bulkUnit} *
                </ThemedText>
                <View style={[styles.priceInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    KES
                  </ThemedText>
                  <TextInput
                    style={[styles.priceInputField, { color: theme.text }]}
                    value={pricePerKg}
                    onChangeText={setPricePerKg}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                Cost per {bulkUnit} (optional)
              </ThemedText>
              <View style={[styles.priceInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  KES
                </ThemedText>
                <TextInput
                  style={[styles.priceInputField, { color: theme.text }]}
                  value={costPerKg}
                  onChangeText={setCostPerKg}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </>
      )}

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
  itemTypeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  itemTypeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  itemTypeText: {
    flex: 1,
  },
  bulkSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  bulkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
});
