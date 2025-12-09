
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
import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { CATEGORIES } from "@/constants/categories";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";
import { Product } from "@/types";
import { formatDate } from "@/utils/format";

type InventoryScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "Inventory">;
};

export default function InventoryScreen({ navigation }: InventoryScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { products, getLowStockProducts, getProductStock, batches } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  const getEarliestExpiryDate = (productId: string) => {
    const productBatches = batches.filter(
      (b) => b.productId === productId && b.quantity > 0
    );
    if (productBatches.length === 0) return null;

    const earliest = productBatches.reduce((earliest, batch) => {
      if (!earliest) return batch;
      return new Date(batch.expiryDate) < new Date(earliest.expiryDate)
        ? batch
        : earliest;
    }, productBatches[0]);

    return earliest.expiryDate;
  };

  const getStockStatus = (stock: number, reorderLevel: number) => {
    if (stock === 0) {
      return { label: "Out of Stock", color: Colors.accent.error };
    } else if (stock <= reorderLevel) {
      return { label: "Critical", color: Colors.accent.warning };
    } else if (stock <= reorderLevel * 2) {
      return { label: "Low Stock", color: Colors.badges.lowStock.text };
    }
    return { label: "In Stock", color: Colors.accent.success };
  };

  const toggleDropdown = (productId: string) => {
    setOpenDropdownId(openDropdownId === productId ? null : productId);
  };

  const handleEditProduct = (productId: string) => {
    setOpenDropdownId(null);
    navigation.navigate("ProductDetail", { productId });
  };

  const handleViewHistory = (productId: string) => {
    setOpenDropdownId(null);
    // Navigate to product detail where history can be viewed
    navigation.navigate("ProductDetail", { productId });
  };

  const handleAdjustStock = (productId: string) => {
    setOpenDropdownId(null);
    // Navigate to product detail where stock can be adjusted
    navigation.navigate("ProductDetail", { productId });
  };

  const handleDeleteProduct = (productId: string) => {
    setOpenDropdownId(null);
    // This would typically show a confirmation dialog
    // For now, just navigate to product detail
    navigation.navigate("ProductDetail", { productId });
  };

  const renderTableHeader = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={true}
    >
      <View style={{ minWidth: 850 }}>
        <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: theme.surface }]}>
          <ThemedText type="caption" style={[styles.headerCell, styles.skuCell]}>
            SKU / ID
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerCell, styles.nameCell]}>
            Product Name
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerCell, styles.categoryCell]}>
            Category
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerCell, styles.stockCell]}>
            Stock Level
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerCell, styles.unitCell]}>
            Unit
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerCell, styles.statusCell]}>
            Status
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerCell, styles.expiryCell]}>
            Expiry Date
          </ThemedText>
          <ThemedText type="caption" style={[styles.headerCell, styles.actionsCell]}>
            Actions
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );

  const renderTableRow = ({ item }: { item: Product }) => {
    const stock = getProductStock(item.id);
    const category = CATEGORIES.find((c) => c.id === item.category);
    const expiryDate = getEarliestExpiryDate(item.id);
    const status = getStockStatus(stock, item.reorderLevel);
    const isDropdownOpen = openDropdownId === item.id;

    return (
      <Pressable
        onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
      >
        <View style={[styles.tableRow, { backgroundColor: theme.background }]}>
          <ThemedText
            type="caption"
            style={[styles.cell, styles.skuCell, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.sku}
          </ThemedText>
          <ThemedText type="small" style={[styles.cell, styles.nameCell]} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.cell, styles.categoryCell]}
            numberOfLines={1}
          >
            {category?.name || "N/A"}
          </ThemedText>
          <ThemedText type="small" style={[styles.cell, styles.stockCell]}>
            {stock}
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.cell, styles.unitCell, { color: theme.textSecondary }]}
          >
            {item.unit}
          </ThemedText>
          <View style={[styles.cell, styles.statusCell]}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + "20" }]}>
              <ThemedText type="caption" style={{ color: status.color }}>
                {status.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText
            type="small"
            style={[styles.cell, styles.expiryCell, { color: theme.textSecondary }]}
          >
            {expiryDate ? formatDate(expiryDate) : "N/A"}
          </ThemedText>
          <View style={[styles.cell, styles.actionsCell]}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                toggleDropdown(item.id);
              }}
              style={({ pressed }) => [
                styles.actionsButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="more-vertical" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderDropdown = (item: Product) => {
    if (openDropdownId !== item.id) return null;

    return (
      <View style={[styles.dropdownOverlay, { backgroundColor: 'transparent' }]}>
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={() => setOpenDropdownId(null)}
        />
        <View style={[styles.dropdown, { backgroundColor: theme.surface }]}>
          <Pressable
            onPress={() => handleEditProduct(item.id)}
            style={({ pressed }) => [
              styles.dropdownItem,
              { backgroundColor: pressed ? theme.divider : "transparent" },
            ]}
          >
            <Feather name="edit" size={16} color={theme.text} />
            <ThemedText type="small" style={styles.dropdownText}>
              Edit Product
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleViewHistory(item.id)}
            style={({ pressed }) => [
              styles.dropdownItem,
              { backgroundColor: pressed ? theme.divider : "transparent" },
            ]}
          >
            <Feather name="clock" size={16} color={theme.text} />
            <ThemedText type="small" style={styles.dropdownText}>
              View History
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleAdjustStock(item.id)}
            style={({ pressed }) => [
              styles.dropdownItem,
              { backgroundColor: pressed ? theme.divider : "transparent" },
            ]}
          >
            <Feather name="trending-up" size={16} color={theme.text} />
            <ThemedText type="small" style={styles.dropdownText}>
              Adjust Stock
            </ThemedText>
          </Pressable>
          <View style={[styles.dropdownDivider, { backgroundColor: theme.divider }]} />
          <Pressable
            onPress={() => handleDeleteProduct(item.id)}
            style={({ pressed }) => [
              styles.dropdownItem,
              { backgroundColor: pressed ? theme.divider : "transparent" },
            ]}
          >
            <Feather name="trash-2" size={16} color={Colors.accent.error} />
            <ThemedText type="small" style={[styles.dropdownText, { color: Colors.accent.error }]}>
              Delete
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

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

      {renderTableHeader()}
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
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              scrollEnabled={true}
            >
              <View style={{ minWidth: 850 }}>
                <FlatList
                  data={filteredProducts}
                  keyExtractor={(item) => item.id}
                  ListHeaderComponent={renderHeader}
                  renderItem={renderTableRow}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                  contentContainerStyle={[styles.tableContainer, { paddingBottom: tabBarHeight + Spacing.xl + 80 }]}
                />
              </View>
            </ScrollView>
            {filteredProducts.map((product) => renderDropdown(product))}
          </>
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
        onPress={() => navigation.navigate("ReceiptUpload")}
        style={({ pressed }) => [
          styles.fab,
          styles.fabSecondary,
          {
            backgroundColor: theme.surface,
            borderWidth: 2,
            borderColor: Colors.primary.main,
            bottom: tabBarHeight + Spacing.xl + 70,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Feather name="camera" size={24} color={Colors.primary.main} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("AddOrRestock")}
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
  tableContainer: {
    paddingBottom: Spacing.xl,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 48,
  },
  tableHeader: {
    borderBottomWidth: 2,
    borderBottomColor: "#D1D5DB",
    marginBottom: Spacing.xs,
  },
  headerCell: {
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    color: "#6B7280",
  },
  cell: {
    paddingHorizontal: Spacing.xs,
  },
  skuCell: {
    width: 100,
  },
  nameCell: {
    width: 180,
  },
  categoryCell: {
    width: 120,
  },
  stockCell: {
    width: 80,
    textAlign: "center",
  },
  unitCell: {
    width: 70,
  },
  statusCell: {
    width: 110,
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  expiryCell: {
    width: 100,
  },
  actionsCell: {
    width: 60,
    alignItems: "center",
  },
  actionsButton: {
    padding: Spacing.xs,
  },
  dropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    minWidth: 200,
    borderRadius: BorderRadius.md,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dropdownText: {
    marginLeft: Spacing.sm,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: Spacing.xs,
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
  fabSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
