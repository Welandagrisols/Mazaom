import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TextInput, Modal, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { Product } from "@/types";

interface BulkSaleModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (weight: number, totalPrice: number) => void;
}

export function BulkSaleModal({ visible, product, onClose, onAddToCart }: BulkSaleModalProps) {
  const { theme } = useTheme();

  const [inputMode, setInputMode] = useState<"weight" | "price">("weight");
  const [weightInput, setWeightInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [calculatedWeight, setCalculatedWeight] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Reset when modal opens or product changes
  useEffect(() => {
    if (visible && product) {
      setWeightInput("");
      setPriceInput("");
      setCalculatedWeight(0);
      setCalculatedPrice(0);
      setInputMode("weight");
    }
  }, [visible, product]);

  const pricePerKg = product?.pricePerKg || product?.retailPrice || 0;

  // Calculate based on weight input
  useEffect(() => {
    if (inputMode === "weight" && weightInput) {
      const weight = parseFloat(weightInput);
      if (!isNaN(weight) && weight > 0) {
        const price = weight * pricePerKg;
        setCalculatedPrice(price);
        setCalculatedWeight(weight);
      } else {
        setCalculatedPrice(0);
        setCalculatedWeight(0);
      }
    }
  }, [weightInput, inputMode, pricePerKg]);

  // Calculate based on price input
  useEffect(() => {
    if (inputMode === "price" && priceInput) {
      const price = parseFloat(priceInput);
      if (!isNaN(price) && price > 0 && pricePerKg > 0) {
        const weight = price / pricePerKg;
        setCalculatedWeight(weight);
        setCalculatedPrice(price);
      } else {
        setCalculatedWeight(0);
        setCalculatedPrice(0);
      }
    }
  }, [priceInput, inputMode, pricePerKg]);

  const handleAddToCart = useCallback(() => {
    try {
      const weight = parseFloat(weightInput);
      if (isNaN(weight) || weight <= 0) {
        Alert.alert("Error", "Please enter a valid weight");
        return;
      }

      // Assuming product.packageWeight is the maximum allowed weight for bulk sale
      const maxWeight = product?.packageWeight || Infinity; 

      if (weight > maxWeight) {
        Alert.alert("Error", `Maximum available weight is ${maxWeight.toFixed(2)} ${product.bulkUnit || 'kg'}`);
        return;
      }

      const totalPrice = weight * pricePerKg;
      onAddToCart(weight, totalPrice);
      setWeightInput(""); // Clear input after successful add
      onClose();
      // Show success alert after closing
      setTimeout(() => {
        Alert.alert("Success", "Bulk sale added to cart!");
      }, 100);
    } catch (error) {
      console.error("Error adding bulk item to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    }
  }, [weightInput, pricePerKg, product, onAddToCart, onClose]);

  if (!product) return null;

  const profit = product.costPerKg 
    ? calculatedPrice - (calculatedWeight * product.costPerKg)
    : 0;
  const profitMargin = product.costPerKg && calculatedPrice > 0
    ? ((profit / calculatedPrice) * 100).toFixed(1)
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.modal, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <ThemedText type="h4">Bulk Sale</ThemedText>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText type="body" style={styles.productName}>
            {product.name}
          </ThemedText>
          <View style={styles.priceInfo}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Price per kg: {formatCurrency(pricePerKg)}
            </ThemedText>
            {product.packageWeight && (
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Package: {product.packageWeight} kg
              </ThemedText>
            )}
          </View>

          {/* Input Mode Toggle */}
          <View style={styles.toggleContainer}>
            <Pressable
              onPress={() => setInputMode("weight")}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: inputMode === "weight" ? Colors.primary.main : theme.backgroundSecondary,
                  borderTopLeftRadius: BorderRadius.md,
                  borderBottomLeftRadius: BorderRadius.md,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{ color: inputMode === "weight" ? "#FFFFFF" : theme.text }}
              >
                Enter Weight
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setInputMode("price")}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: inputMode === "price" ? Colors.primary.main : theme.backgroundSecondary,
                  borderTopRightRadius: BorderRadius.md,
                  borderBottomRightRadius: BorderRadius.md,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{ color: inputMode === "price" ? "#FFFFFF" : theme.text }}
              >
                Enter Price
              </ThemedText>
            </Pressable>
          </View>

          {/* Input Section */}
          {inputMode === "weight" ? (
            <View style={styles.inputContainer}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Weight (kg)
              </ThemedText>
              <View style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
                <TextInput
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  placeholder="0.5"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.inputField, { color: theme.text }]}
                  autoFocus
                />
                <ThemedText type="body" style={{ color: theme.textSecondary }}>kg</ThemedText>
              </View>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                Amount to Pay (KES)
              </ThemedText>
              <View style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>KES</ThemedText>
                <TextInput
                  value={priceInput}
                  onChangeText={setPriceInput}
                  keyboardType="decimal-pad"
                  placeholder="100"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.inputField, { color: theme.text }]}
                  autoFocus
                />
              </View>
            </View>
          )}

          {/* Calculation Results */}
          {(calculatedWeight > 0 || calculatedPrice > 0) && (
            <View style={[styles.resultsCard, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.resultRow}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Weight:
                </ThemedText>
                <ThemedText type="h4">{calculatedWeight.toFixed(2)} kg</ThemedText>
              </View>
              <View style={styles.resultRow}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Total Price:
                </ThemedText>
                <ThemedText type="h4" style={{ color: Colors.primary.main }}>
                  {formatCurrency(calculatedPrice)}
                </ThemedText>
              </View>
              {product.costPerKg && profit > 0 && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  <View style={styles.resultRow}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      Profit:
                    </ThemedText>
                    <ThemedText type="body" style={{ color: Colors.accent.success }}>
                      {formatCurrency(profit)} ({profitMargin}%)
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttons}>
            <Pressable
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="body">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleAddToCart}
              style={[styles.button, { backgroundColor: Colors.primary.main, flex: 1 }]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Add to Cart
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    maxWidth: 450,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  productName: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  priceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  inputField: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: Spacing.sm,
  },
  resultsCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 0.5,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});