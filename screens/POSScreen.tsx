import React, { useState, useCallback, useMemo } from "react";
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
import { CartItemComponent } from "@/components/CartItem";
import { CategoryChip } from "@/components/CategoryChip";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { CATEGORIES } from "@/constants/categories";
import { POSStackParamList } from "@/navigation/POSStackNavigator";

type POSScreenProps = {
  navigation: NativeStackNavigationProp<POSStackParamList, "POS">;
};

export default function POSScreen({ navigation }: POSScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, getCartTotal, getProductStock } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.active);
    
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

  const quickProducts = useMemo(() => {
    return products.filter((p) => p.active).slice(0, 8);
  }, [products]);

  const handleBarcodePress = useCallback(() => {
    // Barcode scanning would be implemented here
  }, []);

  const cartTotal = getCartTotal();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products or scan barcode..."
            onBarcodePress={handleBarcodePress}
          />
        </View>

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

        <View style={styles.mainContent}>
          <View style={styles.productsSection}>
            {!searchQuery && !selectedCategory ? (
              <View style={styles.quickProducts}>
                <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                  Quick Access
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {quickProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      stock={getProductStock(product.id)}
                      compact
                      onPress={() => addToCart(product)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {selectedCategory
                ? CATEGORIES.find((c) => c.id === selectedCategory)?.name
                : "Products"}{" "}
              ({filteredProducts.length})
            </ThemedText>

            {filteredProducts.length > 0 ? (
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    stock={getProductStock(item.id)}
                    onPress={() => addToCart(item)}
                    onAddToCart={() => addToCart(item)}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
              />
            ) : (
              <EmptyState
                icon="search"
                title="No products found"
                description="Try adjusting your search or category filter"
              />
            )}
          </View>

          <View style={[styles.cartSection, { backgroundColor: theme.surface }]}>
            <View style={styles.cartHeader}>
              <Feather name="shopping-cart" size={20} color={Colors.primary.main} />
              <ThemedText type="h4" style={styles.cartTitle}>
                Cart ({cart.length})
              </ThemedText>
            </View>

            {cart.length > 0 ? (
              <>
                <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
                  {cart.map((item) => (
                    <CartItemComponent
                      key={item.id}
                      item={item}
                      onUpdateQuantity={(qty) => updateCartQuantity(item.id, qty)}
                      onRemove={() => removeFromCart(item.id)}
                    />
                  ))}
                </ScrollView>

                <View style={[styles.cartFooter, { borderTopColor: theme.divider }]}>
                  <View style={styles.totalRow}>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                      Total
                    </ThemedText>
                    <ThemedText type="h3" style={{ color: Colors.primary.main }}>
                      {formatCurrency(cartTotal)}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate("Checkout")}
                    style={({ pressed }) => [
                      styles.checkoutButton,
                      { backgroundColor: Colors.primary.main, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Feather name="credit-card" size={20} color="#FFFFFF" />
                    <ThemedText type="body" style={styles.checkoutButtonText}>
                      Checkout
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.emptyCart}>
                <Feather name="shopping-bag" size={40} color={theme.textSecondary} />
                <ThemedText type="body" style={[styles.emptyCartText, { color: theme.textSecondary }]}>
                  Cart is empty
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Tap products to add them
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      {cart.length > 0 ? (
        <Pressable
          onPress={() => navigation.navigate("Checkout")}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: Colors.primary.main,
              bottom: tabBarHeight + Spacing.xl,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Feather name="shopping-cart" size={24} color="#FFFFFF" />
          <View style={styles.fabBadge}>
            <ThemedText type="caption" style={styles.fabBadgeText}>
              {cart.length}
            </ThemedText>
          </View>
        </Pressable>
      ) : null}
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
  categoriesSection: {
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    paddingRight: Spacing.lg,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  productsSection: {
    flex: 1,
    marginRight: Spacing.md,
  },
  quickProducts: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  productsList: {
    paddingBottom: 100,
  },
  cartSection: {
    width: 280,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    display: "none",
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cartTitle: {
    marginLeft: Spacing.sm,
  },
  cartItems: {
    flex: 1,
  },
  cartFooter: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  emptyCart: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyCartText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
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
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.accent.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fabBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
});
