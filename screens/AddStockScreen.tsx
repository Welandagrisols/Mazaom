import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { UNITS } from "@/constants/categories";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";
import { Product } from "@/types";

type AddStockScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "AddStock">;
};

export default function AddStockScreen({ navigation }: AddStockScreenProps) {
  const { theme } = useTheme();
  const { products, addStockEntry, getProductStock, batches } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProductList, setShowProductList] = useState(false);

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
  };

  const handleClearProduct = () => {
    setSelectedProduct(null);
    setSearchQuery("");
    setCostPrice("");
    setQuantity("");
  };

  const handleSubmit = useCallback(async () => {
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
        const message = result.merged
          ? `Added ${quantity} ${UNITS.find(u => u.id === selectedProduct.unit)?.abbr || selectedProduct.unit} to existing batch (same cost price)`
          : `Created new batch with ${quantity} ${UNITS.find(u => u.id === selectedProduct.unit)?.abbr || selectedProduct.unit} (different cost price)`;
        
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

  const renderProductItem = ({ item }: { item: Product }) => {
    const stock = getProductStock(item.id);
    const unit = UNITS.find((u) => u.id === item.unit);
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
            SKU: {item.sku} | Stock: {stock} {unit?.abbr || item.unit}
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: Colors.primary.main }}>
          KES {item.costPrice}
        </ThemedText>
      </Pressable>
    );
  };

  const existingBatches = selectedProduct ? getExistingBatches(selectedProduct.id) : [];
  const matchingBatch = existingBatches.find(
    (b) => b.costPerUnit === parseFloat(costPrice)
  );

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={[styles.infoBox, { backgroundColor: Colors.primary.main + "15", borderColor: Colors.primary.main }]}>
        <Feather name="info" size={16} color={Colors.primary.main} />
        <ThemedText type="caption" style={{ color: Colors.primary.main, marginLeft: Spacing.xs, flex: 1 }}>
          Add stock to existing products. If the cost price matches an existing batch, quantities will be merged.
        </ThemedText>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Search Product *
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
              }
            }}
            placeholder="Search by name or SKU..."
            placeholderTextColor={theme.textSecondary}
            onFocus={() => setShowProductList(true)}
          />
          {selectedProduct && (
            <Pressable onPress={handleClearProduct}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
        
        {showProductList && filteredProducts.length > 0 && !selectedProduct && (
          <View style={[styles.productList, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={renderProductItem}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false}
            />
          </View>
        )}
      </View>

      {selectedProduct && (
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
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Last Cost Price</ThemedText>
                <ThemedText type="body">KES {selectedProduct.costPrice}</ThemedText>
              </View>
            </View>

            {existingBatches.length > 0 && (
              <View style={styles.batchesSection}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                  Existing Batches:
                </ThemedText>
                {existingBatches.slice(0, 3).map((batch) => (
                  <View key={batch.id} style={[styles.batchItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText type="caption">
                      {batch.quantity} units @ KES {batch.costPerUnit}
                    </ThemedText>
                  </View>
                ))}
                {existingBatches.length > 3 && (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    +{existingBatches.length - 3} more batches
                  </ThemedText>
                )}
              </View>
            )}
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
                Cost Price per Unit *
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
                  ? `Will merge with existing batch (${matchingBatch.quantity} units @ KES ${matchingBatch.costPerUnit})`
                  : `Will create a new batch (different cost price from existing batches)`
                }
              </ThemedText>
            </View>
          )}
        </>
      )}

      <Button
        onPress={handleSubmit}
        loading={isLoading}
        icon="plus"
        style={styles.submitButton}
        disabled={!selectedProduct}
      >
        Add Stock
      </Button>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
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
    maxHeight: 250,
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
  batchesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  batchItem: {
    padding: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
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
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
