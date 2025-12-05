import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { InventoryTable } from "@/components/InventoryTable";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { CATEGORIES } from "@/constants/categories";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";
import { Product } from "@/types";

type InventoryScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "Inventory">;
};

export default function InventoryScreen({ navigation }: InventoryScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { products, batches, getLowStockProducts, getProductStock, getProductBatch, deleteProduct } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const lowStockProducts = getLowStockProducts();

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.includes(searchQuery))
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const handleEditProduct = useCallback((product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  }, [navigation]);

  const handleViewHistory = useCallback((product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  }, [navigation]);

  const handleAdjustStock = useCallback((product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  }, [navigation]);

  const handleDeleteProduct = useCallback((product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteProduct(product.id);
          },
        },
      ]
    );
  }, [deleteProduct]);

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  }, [navigation]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl + 80 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            showBarcode={false}
          />
        </View>

        {lowStockProducts.length > 0 ? (
          <View style={[styles.alertBanner, { backgroundColor: Colors.badges.lowStock.bg }]}>
            <Feather name="alert-triangle" size={16} color={Colors.accent.warning} />
            <ThemedText type="small" style={{ color: Colors.accent.warning, marginLeft: 8, flex: 1 }}>
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? "s" : ""} running low on
              stock
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            <CategoryChip
              id="all"
              name="All"
              icon="grid"
              isSelected={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.icon}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.headerRow}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Inventory
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        {filteredProducts.length > 0 ? (
          <InventoryTable
            products={filteredProducts}
            batches={batches}
            getProductStock={getProductStock}
            getProductBatch={getProductBatch}
            onEditProduct={handleEditProduct}
            onViewHistory={handleViewHistory}
            onAdjustStock={handleAdjustStock}
            onDeleteProduct={handleDeleteProduct}
            onProductPress={handleProductPress}
          />
        ) : (
          <EmptyState
            icon="package"
            title="No products found"
            description="Try adjusting your search or category filter"
          />
        )}
      </ScrollView>

      <Pressable
        onPress={() => navigation.navigate("AddProduct")}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: Colors.primary.main,
            bottom: tabBarHeight + Spacing.xl,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  searchSection: {
    marginBottom: Spacing.md,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  categoriesSection: {
    marginBottom: Spacing.lg,
  },
  categoriesContent: {
    paddingRight: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
