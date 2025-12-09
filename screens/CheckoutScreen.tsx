import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, TextInput } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency } from "@/utils/format";
import { PAYMENT_METHODS } from "@/constants/categories";
import { POSStackParamList } from "@/navigation/POSStackNavigator";
import { Customer } from "@/types";

type CheckoutScreenProps = {
  navigation: NativeStackNavigationProp<POSStackParamList, "Checkout">;
};

export default function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { theme } = useTheme();
  const { cart, customers, getCartSubtotal, completeSale, clearCart } = useApp();

  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartSubtotal();
  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;

  const selectedCustomerData: Customer | undefined = useMemo(() => {
    return selectedCustomer ? customers.find(c => c.id === selectedCustomer) : undefined;
  }, [selectedCustomer, customers]);

  const isCreditSale = selectedPayment === "credit";
  const customerCreditLimit = selectedCustomerData?.creditLimit ?? 0;
  const customerCurrentBalance = selectedCustomerData?.currentBalance ?? 0;
  const newBalanceAfterSale = customerCurrentBalance + total;
  const exceedsCreditLimit = isCreditSale && newBalanceAfterSale > customerCreditLimit;
  const creditSaleRequiresCustomer = isCreditSale && !selectedCustomer;

  // Reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      setSelectedPayment("cash");
      setSelectedCustomer(null);
      setDiscount("");
      setNotes("");
    }, [])
  );

  const handleCompleteSale = useCallback(async () => {
    try {
      if (cart.length === 0) {
        Alert.alert("Error", "Cart is empty");
        return;
      }

      if (selectedPayment === "credit" && !selectedCustomer) {
        Alert.alert("Customer Required", "Please select a customer for credit sales.");
        return;
      }

      if (selectedPayment === "credit" && selectedCustomer) {
        const customer = customers.find((c) => c.id === selectedCustomer);
        if (customer) {
          const newBalance = customer.currentBalance + total;
          if (newBalance > customer.creditLimit) {
            Alert.alert(
              "Credit Limit Exceeded",
              `This sale would exceed ${customer.name}'s credit limit of ${formatCurrency(customer.creditLimit)}. Current balance: ${formatCurrency(customer.currentBalance)}. New balance would be: ${formatCurrency(newBalance)}.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Proceed Anyway",
                  style: "destructive",
                  onPress: () => processCompleteSale(),
                },
              ]
            );
            return;
          }
        }
      }

      await processCompleteSale();
    } catch (error) {
      console.error("Error in handleCompleteSale:", error);
      Alert.alert("Error", "Failed to process sale. Please check your details and try again.");
    }
  }, [cart, selectedPayment, selectedCustomer, customers, total, selectedCustomerData, customerCreditLimit, customerCurrentBalance, newBalanceAfterSale, processCompleteSale]);

  const processCompleteSale = useCallback(async () => {
    setIsProcessing(true);
    try {
      const transaction = await completeSale(
        selectedPayment,
        selectedCustomer || undefined,
        discountAmount,
        notes || undefined
      );

      if (transaction) {
        // Navigate back immediately after successful sale
        navigation.goBack();
        // Then show success alert after navigation
        setTimeout(() => {
          Alert.alert("Sale Complete", `Transaction ${transaction.transactionNumber} completed successfully!`,
            [
              {
                text: "View Details",
                onPress: () => {
                  navigation.navigate("Transactions");
                  navigation.navigate("TransactionDetail", { transactionId: transaction.id });
                },
              },
              {
                text: "OK",
                style: "cancel"
              },
            ]
          );
        }, 100); // Small delay to ensure navigation has completed
      } else {
        Alert.alert("Error", "Failed to complete sale. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, selectedPayment, selectedCustomer, discountAmount, notes, completeSale, navigation]);

  // Early return check after all hooks
  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <ThemedText type="body">Cart is empty</ThemedText>
      </View>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Order Summary
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {cart.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <ThemedText type="body">{item.product.name}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </ThemedText>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.summaryRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Subtotal
            </ThemedText>
            <ThemedText type="body">{formatCurrency(subtotal)}</ThemedText>
          </View>
          {discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: Colors.accent.success }}>
                Discount
              </ThemedText>
              <ThemedText type="body" style={{ color: Colors.accent.success }}>
                -{formatCurrency(discountAmount)}
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <ThemedText type="h4">Total</ThemedText>
            <ThemedText type="h3" style={{ color: Colors.primary.main }}>
              {formatCurrency(total)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Customer (Optional)
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.customersScroll}
        >
          <Pressable
            onPress={() => setSelectedCustomer(null)}
            style={[
              styles.customerChip,
              {
                backgroundColor: selectedCustomer === null ? Colors.primary.main : theme.surface,
                borderColor: selectedCustomer === null ? Colors.primary.main : theme.divider,
              },
            ]}
          >
            <Feather
              name="user-x"
              size={16}
              color={selectedCustomer === null ? "#FFFFFF" : theme.text}
            />
            <ThemedText
              type="small"
              style={{ color: selectedCustomer === null ? "#FFFFFF" : theme.text, marginLeft: 6 }}
            >
              Walk-in
            </ThemedText>
          </Pressable>
          {customers.map((customer) => (
            <Pressable
              key={customer.id}
              onPress={() => setSelectedCustomer(customer.id)}
              style={[
                styles.customerChip,
                {
                  backgroundColor:
                    selectedCustomer === customer.id ? Colors.primary.main : theme.surface,
                  borderColor:
                    selectedCustomer === customer.id ? Colors.primary.main : theme.divider,
                },
              ]}
            >
              <Feather
                name="user"
                size={16}
                color={selectedCustomer === customer.id ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                type="small"
                style={{
                  color: selectedCustomer === customer.id ? "#FFFFFF" : theme.text,
                  marginLeft: 6,
                }}
              >
                {customer.name}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Payment Method
        </ThemedText>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map((method) => (
            <Pressable
              key={method.id}
              onPress={() => setSelectedPayment(method.id)}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: selectedPayment === method.id ? Colors.primary.main : theme.surface,
                  borderColor: selectedPayment === method.id ? Colors.primary.main : theme.divider,
                },
              ]}
            >
              <Feather
                name={method.icon as any}
                size={24}
                color={selectedPayment === method.id ? "#FFFFFF" : Colors.primary.main}
              />
              <ThemedText
                type="small"
                style={{
                  color: selectedPayment === method.id ? "#FFFFFF" : theme.text,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {method.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {isCreditSale && (
        <View style={styles.section}>
          <View style={[styles.creditInfoCard, {
            backgroundColor: creditSaleRequiresCustomer ? Colors.accent.warning + '15' : exceedsCreditLimit ? Colors.accent.error + '15' : Colors.accent.success + '15',
            borderColor: creditSaleRequiresCustomer ? Colors.accent.warning : exceedsCreditLimit ? Colors.accent.error : Colors.accent.success,
          }]}>
            <View style={styles.creditInfoRow}>
              <Feather
                name={creditSaleRequiresCustomer ? "alert-circle" : exceedsCreditLimit ? "alert-triangle" : "check-circle"}
                size={20}
                color={creditSaleRequiresCustomer ? Colors.accent.warning : exceedsCreditLimit ? Colors.accent.error : Colors.accent.success}
              />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
                {creditSaleRequiresCustomer
                  ? "Select a customer for credit sale"
                  : exceedsCreditLimit
                    ? "Credit limit would be exceeded"
                    : "Credit sale"}
              </ThemedText>
            </View>
            {selectedCustomerData && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.divider, marginVertical: Spacing.sm }]} />
                <View style={styles.creditInfoRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Credit Limit:</ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{formatCurrency(customerCreditLimit)}</ThemedText>
                </View>
                <View style={styles.creditInfoRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Current Balance:</ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600', color: customerCurrentBalance > 0 ? Colors.accent.error : theme.text }}>
                    {formatCurrency(customerCurrentBalance)}
                  </ThemedText>
                </View>
                <View style={styles.creditInfoRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>After This Sale:</ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600', color: exceedsCreditLimit ? Colors.accent.error : theme.text }}>
                    {formatCurrency(newBalanceAfterSale)}
                  </ThemedText>
                </View>
                <View style={styles.creditInfoRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Available Credit:</ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600', color: exceedsCreditLimit ? Colors.accent.error : Colors.accent.success }}>
                    {formatCurrency(Math.max(0, customerCreditLimit - newBalanceAfterSale))}
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Discount
        </ThemedText>
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            KES
          </ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={discount}
            onChangeText={setDiscount}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Notes (Optional)
        </ThemedText>
        <TextInput
          style={[
            styles.notesInput,
            { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes about this transaction..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>

      <Button
        onPress={handleCompleteSale}
        loading={isProcessing}
        disabled={cart.length === 0 || isProcessing}
        icon="check-circle"
        size="large"
        style={styles.completeButton}
      >
        Complete Sale - {formatCurrency(total)}
      </Button>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  orderItemInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  customersScroll: {
    paddingRight: Spacing.lg,
  },
  customerChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  paymentOption: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
  },
  input: {
    flex: 1,
    fontSize: 18,
    marginLeft: Spacing.sm,
  },
  notesInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  completeButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  creditInfoCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  creditInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});