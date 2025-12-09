import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, Alert, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { CATEGORIES, UNITS, CategoryId, UnitId } from "@/constants/categories";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";
import { Product, ItemType } from "@/types";

type AddOrRestockScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "AddOrRestock">;
};

type Mode = "search" | "restock" | "new";

export default function AddOrRestockScreen({ navigation }: AddOrRestockScreenProps) {
  const { theme } = useTheme();
  const { products, addProduct, addStockEntry, getProductStock, batches } = useApp();

  const [mode, setMode] = useState<Mode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductList, setShowProductList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<CategoryId>(CATEGORIES[0].id);
  const [unit, setUnit] = useState<UnitId>(UNITS[0].id);
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [initialQuantity, setInitialQuantity] = useState("");
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

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [products, searchQuery]);

  const getExistingBatches = useCallback((productId: string) => {
    return batches.filter((b) => b.productId === productId && b.quantity > 0);
  }, [batches]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setShowProductList(false);
    setCostPrice(product.costPrice.toString());
    setMode("restock");
  };

  const handleCreateNew = () => {
    setName(searchQuery);
    setMode("new");
    setShowProductList(false);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSearchQuery("");
    setCostPrice("");
    setQuantity("");
    setMode("search");
  };

  const handleRestockSubmit = useCallback(async () => {
    if (!selectedProduct) {
      Alert.alert("Error", "Please select a product");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }
    if (!costPrice || parseFloat(costPrice) <= 0) {
      Alert.alert("Error", "Please enter a valid cost price");
      return;
    }

    setIsLoading(true);
    try {
      const result = await addStockEntry(
        selectedProduct.id,
        parseFloat(quantity),
        parseFloat(costPrice)
      );

      if (result) {
        const unitAbbr = UNITS.find(u => u.id === selectedProduct.unit)?.abbr || selectedProduct.unit;
        const message = result.merged
          ? `Added ${quantity} ${unitAbbr} to existing batch`
          : `Created new batch with ${quantity} ${unitAbbr}`;
        
        navigation.goBack();
        setTimeout(() => {
          Alert.alert("Stock Added", message);
        }, 100);
      } else {
        Alert.alert("Error", "Failed to add stock. Please try again.");
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProduct, quantity, costPrice, addStockEntry, navigation]);

  const handleNewProductSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a product name");
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
      const finalSku = sku.trim() 
        ? sku.trim().toUpperCase() 
        : `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const productData: Parameters<typeof addProduct>[0] = {
        name: name.trim(),
        description: description.trim(),
        sku: finalSku,
        category: category as any,
        unit: unit as any,
        retailPrice: parseFloat(retailPrice),
        wholesalePrice: parseFloat(wholesalePrice) || parseFloat(retailPrice) * 0.9,
        costPrice: parseFloat(newCostPrice) || parseFloat(retailPrice) * 0.7,
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

      const initialStock = initialQuantity && parseFloat(initialQuantity) > 0
        ? { quantity: parseFloat(initialQuantity), costPerUnit: parseFloat(newCostPrice) || parseFloat(retailPrice) * 0.7 }
        : undefined;

      const success = await addProduct(productData, initialStock);

      if (success) {
        const stockMsg = initialStock ? ` with ${initialQuantity} units in stock` : "";
        navigation.goBack();
        setTimeout(() => {
          Alert.alert("Success", `Product "${name}" added${stockMsg}`);
        }, 100);
      } else {
        Alert.alert("Error", "Failed to add product. Please try again.");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, description, sku, category, unit, retailPrice, wholesalePrice, newCostPrice, reorderLevel, itemType, packageWeight, pricePerKg, costPerKg, bulkUnit, initialQuantity, addProduct, navigation]);

  const existingBatches = selectedProduct ? getExistingBatches(selectedProduct.id) : [];
  const matchingBatch = existingBatches.find(
    (b) => b.costPerUnit === parseFloat(costPrice)
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const stock = getProductStock(item.id);
    const unitInfo = UNITS.find((u) => u.id === item.unit);
    return (
      <Pressable
        onPress={() => handleSelectProduct(item)}
        style={({ pressed }) => [
          styles.productItem,
          { backgroundColor: pressed ? theme.divider : theme.surface },
        ]}
      >
        <View style={styles.productInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            SKU: {item.sku} | Stock: {stock} {unitInfo?.abbr || item.unit}
          </ThemedText>
        </View>
        <Feather name="plus-circle" size={20} color={Colors.primary.main} />
      </Pressable>
    );
  };

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
      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Search or Add Product
        </ThemedText>
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowProductList(true);
              if (!text.trim()) {
                setSelectedProduct(null);
                setMode("search");
              }
            }}
            placeholder="Type product name or SKU..."
            placeholderTextColor={theme.textSecondary}
            onFocus={() => setShowProductList(true)}
            editable={mode !== "new"}
          />
          {(selectedProduct || mode === "new") && (
            <Pressable onPress={handleClearSelection}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
        
        {showProductList && searchQuery.trim() && mode === "search" && (
          <View style={[styles.productList, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            {filteredProducts.length > 0 ? (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={renderProductItem}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={false}
              />
            ) : null}
            <Pressable
              onPress={handleCreateNew}
              style={({ pressed }) => [
                styles.createNewItem,
                { backgroundColor: pressed ? Colors.primary.main + "20" : Colors.primary.main + "10" },
              ]}
            >
              <Feather name="plus" size={18} color={Colors.primary.main} />
              <ThemedText type="body" style={{ color: Colors.primary.main, marginLeft: Spacing.sm, fontWeight: "600" }}>
                Create "{searchQuery}" as new product
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      {mode === "restock" && selectedProduct && (
        <>
          <View style={[styles.selectedProduct, { backgroundColor: theme.surface, borderColor: Colors.primary.main }]}>
            <View style={styles.selectedProductHeader}>
              <Feather name="check-circle" size={18} color={Colors.primary.main} />
              <ThemedText type="body" style={{ fontWeight: "600", marginLeft: Spacing.xs, flex: 1 }}>
                {selectedProduct.name}
              </ThemedText>
            </View>
            <View style={styles.selectedProductDetails}>
              <View style={styles.detailItem}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Current Stock</ThemedText>
                <ThemedText type="body">{getProductStock(selectedProduct.id)} {UNITS.find(u => u.id === selectedProduct.unit)?.abbr}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Last Cost</ThemedText>
                <ThemedText type="body">KES {selectedProduct.costPrice}</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                Quantity to Add *
              </ThemedText>
              <View style={[styles.priceInput, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
                <TextInput
                  style={[styles.priceInputField, { color: theme.text }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  {UNITS.find(u => u.id === selectedProduct.unit)?.abbr || selectedProduct.unit}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                Cost Price *
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
          </View>

          {costPrice && parseFloat(costPrice) > 0 && (
            <View style={[
              styles.mergeInfo,
              { 
                backgroundColor: matchingBatch ? Colors.accent.success + "15" : Colors.accent.warning + "15",
                borderColor: matchingBatch ? Colors.accent.success : Colors.accent.warning,
              }
            ]}>
              <Feather 
                name={matchingBatch ? "git-merge" : "git-branch"} 
                size={16} 
                color={matchingBatch ? Colors.accent.success : Colors.accent.warning} 
              />
              <ThemedText 
                type="caption" 
                style={{ 
                  color: matchingBatch ? Colors.accent.success : Colors.accent.warning, 
                  marginLeft: Spacing.xs, 
                  flex: 1 
                }}
              >
                {matchingBatch
                  ? `Will merge with existing batch`
                  : `Will create new batch (different cost)`
                }
              </ThemedText>
            </View>
          )}

          <Button
            onPress={handleRestockSubmit}
            loading={isLoading}
            icon="plus"
            style={styles.submitButton}
          >
            Add Stock
          </Button>
        </>
      )}

      {mode === "new" && (
        <>
          <View style={[styles.modeIndicator, { backgroundColor: Colors.primary.main + "15", borderColor: Colors.primary.main }]}>
            <Feather name="package" size={16} color={Colors.primary.main} />
            <ThemedText type="caption" style={{ color: Colors.primary.main, marginLeft: Spacing.xs, flex: 1 }}>
              Creating new product: "{name || searchQuery}"
            </ThemedText>
          </View>

          {renderInput("Product Name *", name, setName, { placeholder: "e.g., Dairy Meal 70kg" })}
          {renderInput("Description", description, setDescription, { placeholder: "Product description", multiline: true })}
          {renderInput("SKU (optional)", sku, setSku, { placeholder: "Auto-generated if empty" })}

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
                <Feather name="box" size={20} color={itemType === "unit" ? "#FFFFFF" : Colors.primary.main} />
                <View style={styles.itemTypeText}>
                  <ThemedText type="body" style={{ color: itemType === "unit" ? "#FFFFFF" : theme.text, fontWeight: "600" }}>
                    Unit/Countable
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: itemType === "unit" ? "#FFFFFF" : theme.textSecondary }}>
                    Sold as whole units
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
                <Feather name="layers" size={20} color={itemType === "bulk" ? "#FFFFFF" : Colors.primary.main} />
                <View style={styles.itemTypeText}>
                  <ThemedText type="body" style={{ color: itemType === "bulk" ? "#FFFFFF" : theme.text, fontWeight: "600" }}>
                    Bulk/Divisible
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: itemType === "bulk" ? "#FFFFFF" : theme.textSecondary }}>
                    Sell by weight/volume
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          </View>

          {itemType === "bulk" && (
            <View style={[styles.bulkSection, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
              <View style={styles.inputGroup}>
                <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                  Bulk Unit
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
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
                      <ThemedText type="caption" style={{ color: bulkUnit === u.id ? "#FFFFFF" : theme.text }}>
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
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>{bulkUnit}</ThemedText>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                    Price per {bulkUnit} *
                  </ThemedText>
                  <View style={[styles.priceInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>KES</ThemedText>
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
            </View>
          )}

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
              Category
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
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
                  <Feather name={cat.icon as any} size={14} color={category === cat.id ? "#FFFFFF" : Colors.primary.main} />
                  <ThemedText type="caption" style={{ color: category === cat.id ? "#FFFFFF" : theme.text, marginLeft: 4 }}>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
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
                  <ThemedText type="caption" style={{ color: unit === u.id ? "#FFFFFF" : theme.text }}>
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
                <ThemedText type="body" style={{ color: theme.textSecondary }}>KES</ThemedText>
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
                <ThemedText type="body" style={{ color: theme.textSecondary }}>KES</ThemedText>
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
                <ThemedText type="body" style={{ color: theme.textSecondary }}>KES</ThemedText>
                <TextInput
                  style={[styles.priceInputField, { color: theme.text }]}
                  value={newCostPrice}
                  onChangeText={setNewCostPrice}
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
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
                value={reorderLevel}
                onChangeText={setReorderLevel}
                placeholder="10"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.stockSection, { backgroundColor: Colors.accent.success + "10", borderColor: Colors.accent.success }]}>
            <View style={styles.stockHeader}>
              <Feather name="package" size={16} color={Colors.accent.success} />
              <ThemedText type="small" style={{ color: Colors.accent.success, marginLeft: Spacing.xs, fontWeight: "600" }}>
                Initial Stock (Optional)
              </ThemedText>
            </View>
            <View style={[styles.priceInput, { backgroundColor: theme.surface, borderColor: theme.divider, marginTop: Spacing.sm }]}>
              <TextInput
                style={[styles.priceInputField, { color: theme.text }]}
                value={initialQuantity}
                onChangeText={setInitialQuantity}
                placeholder="Enter starting quantity (or leave empty)"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {UNITS.find(u => u.id === unit)?.abbr || unit}
              </ThemedText>
            </View>
          </View>

          <Button
            onPress={handleNewProductSubmit}
            loading={isLoading}
            icon="plus"
            style={styles.submitButton}
          >
            Create Product
          </Button>
        </>
      )}

      {mode === "search" && !searchQuery.trim() && (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
            Search for an existing product to add stock,{"\n"}or type a new name to create one
          </ThemedText>
        </View>
      )}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  productList: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  productInfo: {
    flex: 1,
  },
  createNewItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  selectedProduct: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  selectedProductHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  selectedProductDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  detailItem: {
    flex: 1,
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
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
  mergeInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
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
  stockSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  stockHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
});
