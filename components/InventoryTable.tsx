import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ActionDropdown, ActionMenuItem } from "@/components/ActionDropdown";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Product, InventoryBatch } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { CATEGORIES, UNITS } from "@/constants/categories";

interface InventoryTableProps {
  products: Product[];
  batches: InventoryBatch[];
  getProductStock: (productId: string) => number;
  getProductBatch: (productId: string) => InventoryBatch | undefined;
  onEditProduct: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onProductPress: (product: Product) => void;
}

type StockStatus = "inStock" | "lowStock" | "outOfStock" | "critical";

const getStockStatus = (stock: number, reorderLevel: number): StockStatus => {
  if (stock === 0) return "outOfStock";
  if (stock <= 5) return "critical";
  if (stock <= reorderLevel) return "lowStock";
  return "inStock";
};

const statusConfig = {
  inStock: { label: "In Stock", bg: Colors.badges.inStock.bg, text: Colors.badges.inStock.text },
  lowStock: { label: "Low Stock", bg: Colors.badges.lowStock.bg, text: Colors.badges.lowStock.text },
  outOfStock: { label: "Out of Stock", bg: Colors.badges.outOfStock.bg, text: Colors.badges.outOfStock.text },
  critical: { label: "Critical", bg: "#FFEBEE", text: "#D32F2F" },
};

export function InventoryTable({
  products,
  batches,
  getProductStock,
  getProductBatch,
  onEditProduct,
  onViewHistory,
  onAdjustStock,
  onDeleteProduct,
  onProductPress,
}: InventoryTableProps) {
  const { theme } = useTheme();

  const getUnitAbbr = (unitId: string) => {
    const unit = UNITS.find((u) => u.id === unitId);
    return unit?.abbr || unitId;
  };

  const getCategoryName = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  const renderTableHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.divider }]}>
      <View style={styles.colSku}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          SKU / ID
        </ThemedText>
      </View>
      <View style={styles.colName}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Product Name
        </ThemedText>
      </View>
      <View style={styles.colCategory}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Category
        </ThemedText>
      </View>
      <View style={styles.colStock}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Stock Level
        </ThemedText>
      </View>
      <View style={styles.colUnit}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Unit
        </ThemedText>
      </View>
      <View style={styles.colBuyPrice}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Buy Price
        </ThemedText>
      </View>
      <View style={styles.colSellPrice}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Sell Price
        </ThemedText>
      </View>
      <View style={styles.colStatus}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Status
        </ThemedText>
      </View>
      <View style={styles.colExpiry}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Expiry Date
        </ThemedText>
      </View>
      <View style={styles.colActions}>
        <ThemedText type="caption" style={[styles.headerText, { color: theme.textSecondary }]}>
          Actions
        </ThemedText>
      </View>
    </View>
  );

  const renderTableRow = (product: Product, index: number) => {
    const stock = getProductStock(product.id);
    const batch = getProductBatch(product.id);
    const status = getStockStatus(stock, product.reorderLevel);
    const statusStyle = statusConfig[status];

    const actions: ActionMenuItem[] = [
      {
        id: "edit",
        label: "Edit Product",
        icon: "edit-2",
        onPress: () => onEditProduct(product),
      },
      {
        id: "history",
        label: "View History",
        icon: "clock",
        onPress: () => onViewHistory(product),
      },
      {
        id: "adjust",
        label: "Adjust Stock",
        icon: "package",
        onPress: () => onAdjustStock(product),
      },
      {
        id: "delete",
        label: "Delete",
        icon: "trash-2",
        color: Colors.accent.error,
        onPress: () => onDeleteProduct(product),
      },
    ];

    const margin = ((product.retailPrice - product.costPrice) / product.costPrice) * 100;

    return (
      <View
        key={product.id}
        style={[
          styles.dataRow,
          { 
            backgroundColor: index % 2 === 0 ? theme.surface : theme.backgroundSecondary,
            borderBottomColor: theme.divider,
          },
        ]}
      >
        <View style={styles.colSku}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
            {product.sku}
          </ThemedText>
        </View>
        <View style={styles.colName}>
          <ThemedText type="small" style={styles.productName} numberOfLines={2}>
            {product.name}
          </ThemedText>
        </View>
        <View style={styles.colCategory}>
          <ThemedText type="small" style={{ color: theme.text }}>
            {getCategoryName(product.category)}
          </ThemedText>
        </View>
        <View style={styles.colStock}>
          <ThemedText type="small" style={{ color: theme.text, fontWeight: "500" }}>
            {stock}
          </ThemedText>
        </View>
        <View style={styles.colUnit}>
          <ThemedText type="small" style={{ color: theme.text }}>
            {getUnitAbbr(product.unit)}
          </ThemedText>
        </View>
        <View style={styles.colBuyPrice}>
          <ThemedText type="small" style={{ color: theme.text }}>
            {formatCurrency(product.costPrice)}
          </ThemedText>
        </View>
        <View style={styles.colSellPrice}>
          <ThemedText type="small" style={{ color: Colors.primary.main, fontWeight: "500" }}>
            {formatCurrency(product.retailPrice)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: Colors.accent.success, fontSize: 10 }}>
            +{margin.toFixed(0)}%
          </ThemedText>
        </View>
        <View style={styles.colStatus}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <ThemedText type="caption" style={{ color: statusStyle.text, fontWeight: "500" }}>
              {statusStyle.label}
            </ThemedText>
          </View>
        </View>
        <View style={styles.colExpiry}>
          <ThemedText type="small" style={{ color: theme.text }}>
            {batch?.expiryDate ? formatDate(batch.expiryDate) : "-"}
          </ThemedText>
        </View>
        <View style={styles.colActions}>
          <ActionDropdown actions={actions} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={styles.table}>
          {renderTableHeader()}
          {products.map((product, index) => renderTableRow(product, index))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  table: {
    minWidth: 900,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerText: {
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  colSku: {
    width: 80,
    paddingHorizontal: Spacing.xs,
  },
  colName: {
    width: 140,
    paddingHorizontal: Spacing.xs,
  },
  colCategory: {
    width: 90,
    paddingHorizontal: Spacing.xs,
  },
  colStock: {
    width: 70,
    paddingHorizontal: Spacing.xs,
    alignItems: "center",
  },
  colUnit: {
    width: 60,
    paddingHorizontal: Spacing.xs,
  },
  colBuyPrice: {
    width: 90,
    paddingHorizontal: Spacing.xs,
  },
  colSellPrice: {
    width: 90,
    paddingHorizontal: Spacing.xs,
  },
  colStatus: {
    width: 100,
    paddingHorizontal: Spacing.xs,
  },
  colExpiry: {
    width: 90,
    paddingHorizontal: Spacing.xs,
  },
  colActions: {
    width: 60,
    alignItems: "center",
  },
  productName: {
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
});
