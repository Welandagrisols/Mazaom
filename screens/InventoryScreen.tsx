import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, ScrollView, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { CATEGORIES } from "@/constants/categories";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";

type InventoryScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "Inventory">;
};

export default function InventoryScreen({ navigation }: InventoryScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { products, getLowStockProducts, getProductStock } = useApp();

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

  const renderHeader = () => (
    <>
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

      <ThemedText type="small" style={[styles.resultCount, { color: theme.textSecondary }]}>
        {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
      </ThemedText>
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            showBarcode={false}
          />
        </View>

        {filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                stock={getProductStock(item.id)}
                onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.productsList, { paddingBottom: tabBarHeight + Spacing.xl + 80 }]}
          />
        ) : (
          <View style={styles.emptyContainer}>
            {renderHeader()}
            <EmptyState
              icon="package"
              title="No products found"
              description="Try adjusting your search or category filter"
            />
          </View>
        )}
      </View>

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
  content: {
    flex: 1,
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
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    paddingRight: Spacing.lg,
  },
  resultCount: {
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  productsList: {
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
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
