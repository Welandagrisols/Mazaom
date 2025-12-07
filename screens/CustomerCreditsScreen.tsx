import React, { useState, useMemo, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, Modal, TextInput, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency, formatPhone } from "@/utils/format";
import { Customer, CreditTransaction } from "@/types";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type CustomerCreditsScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "CustomerCredits">;
};

const PAYMENT_OPTIONS = [
  { id: "cash", name: "Cash", icon: "dollar-sign" },
  { id: "mpesa", name: "M-Pesa", icon: "smartphone" },
  { id: "bank", name: "Bank Transfer", icon: "credit-card" },
];

export default function CustomerCreditsScreen({ navigation }: CustomerCreditsScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { 
    customers, 
    getCustomersWithDebt, 
    getTotalOutstandingDebt, 
    getCustomerCreditHistory,
    recordCreditPayment 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const customersWithDebt = useMemo(() => getCustomersWithDebt(), [getCustomersWithDebt]);
  const totalDebt = useMemo(() => getTotalOutstandingDebt(), [getTotalOutstandingDebt]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customersWithDebt;
    const query = searchQuery.toLowerCase();
    return customersWithDebt.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  }, [customersWithDebt, searchQuery]);

  const customerCreditHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return getCustomerCreditHistory(selectedCustomer.id);
  }, [selectedCustomer, getCustomerCreditHistory]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleOpenPaymentModal = () => {
    setPaymentAmount("");
    setPaymentMethod("cash");
    setReferenceNumber("");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const handleRecordPayment = useCallback(async () => {
    if (!selectedCustomer) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    if (amount > selectedCustomer.currentBalance) {
      Alert.alert(
        "Amount Exceeds Balance",
        `The payment amount (${formatCurrency(amount)}) exceeds the customer's current balance (${formatCurrency(selectedCustomer.currentBalance)}). Are you sure you want to record this payment?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Proceed", 
            onPress: () => processPayment(amount)
          }
        ]
      );
      return;
    }

    await processPayment(amount);
  }, [selectedCustomer, paymentAmount]);

  const processPayment = async (amount: number) => {
    if (!selectedCustomer) return;
    
    setIsProcessing(true);
    try {
      const success = await recordCreditPayment(
        selectedCustomer.id,
        amount,
        paymentMethod,
        referenceNumber || undefined,
        paymentNotes || undefined
      );

      if (success) {
        setShowPaymentModal(false);
        Alert.alert(
          "Payment Recorded",
          `Payment of ${formatCurrency(amount)} has been recorded for ${selectedCustomer.name}.`
        );
        setSelectedCustomer(prev => 
          prev ? { ...prev, currentBalance: prev.currentBalance - amount } : null
        );
      } else {
        Alert.alert("Error", "Failed to record payment. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while recording the payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-KE", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const percentUsed = item.creditLimit > 0 
      ? Math.min(100, (item.currentBalance / item.creditLimit) * 100) 
      : 100;
    const isOverLimit = item.currentBalance > item.creditLimit;

    return (
      <Pressable
        onPress={() => handleSelectCustomer(item)}
        style={({ pressed }) => [
          styles.customerCard,
          { 
            backgroundColor: theme.surface, 
            opacity: pressed ? 0.9 : 1,
            borderColor: selectedCustomer?.id === item.id ? Colors.primary.main : theme.divider,
            borderWidth: selectedCustomer?.id === item.id ? 2 : 1,
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: Colors.accent.error + "20" }]}>
          <ThemedText type="h4" style={{ color: Colors.accent.error }}>
            {item.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.customerInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatPhone(item.phone)}
          </ThemedText>
          <View style={styles.creditBar}>
            <View 
              style={[
                styles.creditBarFill, 
                { 
                  width: `${percentUsed}%`,
                  backgroundColor: isOverLimit ? Colors.accent.error : percentUsed > 80 ? Colors.accent.warning : Colors.primary.main 
                }
              ]} 
            />
          </View>
          <ThemedText type="small" style={{ color: isOverLimit ? Colors.accent.error : theme.textSecondary }}>
            {formatCurrency(item.currentBalance)} / {formatCurrency(item.creditLimit)}
          </ThemedText>
        </View>
        <View style={styles.balanceSection}>
          <ThemedText type="h4" style={{ color: Colors.accent.error }}>
            {formatCurrency(item.currentBalance)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            owed
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderTransactionItem = ({ item }: { item: CreditTransaction }) => {
    const isPayment = item.type === "payment";
    
    return (
      <View style={[styles.transactionItem, { backgroundColor: theme.surface }]}>
        <View style={[
          styles.transactionIcon, 
          { backgroundColor: isPayment ? Colors.accent.success + "20" : Colors.accent.error + "20" }
        ]}>
          <Feather 
            name={isPayment ? "arrow-down-left" : "arrow-up-right"} 
            size={16} 
            color={isPayment ? Colors.accent.success : Colors.accent.error} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <ThemedText type="body" style={{ fontWeight: "500" }}>
            {isPayment ? "Payment Received" : item.type === "credit_sale" ? "Credit Sale" : "Adjustment"}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatTransactionDate(item.createdAt)}
          </ThemedText>
          {item.notes && (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
              {item.notes}
            </ThemedText>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <ThemedText 
            type="body" 
            style={{ 
              fontWeight: "600", 
              color: isPayment ? Colors.accent.success : Colors.accent.error 
            }}
          >
            {isPayment ? "-" : "+"}{formatCurrency(item.amount)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Bal: {formatCurrency(item.balanceAfter)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={[styles.totalDebtCard, { backgroundColor: Colors.accent.error + "15" }]}>
          <View style={styles.totalDebtHeader}>
            <Feather name="alert-circle" size={24} color={Colors.accent.error} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: Colors.accent.error }}>
              Total Outstanding Debt
            </ThemedText>
          </View>
          <ThemedText type="h2" style={{ color: Colors.accent.error, marginTop: Spacing.sm }}>
            {formatCurrency(totalDebt)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            from {customersWithDebt.length} customer{customersWithDebt.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search customers with debt..."
            showBarcode={false}
          />
        </View>

        <View style={styles.mainContent}>
          <View style={styles.customersList}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Customers with Credit
            </ThemedText>
            {filteredCustomers.length > 0 ? (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={renderCustomerItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
              />
            ) : (
              <EmptyState
                icon="check-circle"
                title="No outstanding debts"
                description={searchQuery ? "Try a different search" : "All customers are paid up!"}
              />
            )}
          </View>

          {selectedCustomer && (
            <View style={[styles.detailPanel, { backgroundColor: theme.surface }]}>
              <View style={styles.detailHeader}>
                <View>
                  <ThemedText type="h4">{selectedCustomer.name}</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Credit History
                  </ThemedText>
                </View>
                <Pressable onPress={() => setSelectedCustomer(null)}>
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              <View style={[styles.balanceCard, { backgroundColor: Colors.accent.error + "10" }]}>
                <View style={styles.balanceRow}>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>Current Balance</ThemedText>
                  <ThemedText type="h3" style={{ color: Colors.accent.error }}>
                    {formatCurrency(selectedCustomer.currentBalance)}
                  </ThemedText>
                </View>
                <View style={styles.balanceRow}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Credit Limit</ThemedText>
                  <ThemedText type="body">{formatCurrency(selectedCustomer.creditLimit)}</ThemedText>
                </View>
              </View>

              <Button
                onPress={handleOpenPaymentModal}
                icon="dollar-sign"
                style={{ marginBottom: Spacing.md }}
              >
                Record Payment
              </Button>

              <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
                Transaction History
              </ThemedText>

              {customerCreditHistory.length > 0 ? (
                <FlatList
                  data={customerCreditHistory}
                  keyExtractor={(item) => item.id}
                  renderItem={renderTransactionItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.xl }}
                />
              ) : (
                <View style={styles.emptyHistory}>
                  <Feather name="file-text" size={40} color={theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                    No credit history
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Record Payment</ThemedText>
              <Pressable onPress={() => setShowPaymentModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedCustomer && (
              <View style={[styles.customerSummary, { backgroundColor: theme.surface }]}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {selectedCustomer.name}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Current Balance: {formatCurrency(selectedCustomer.currentBalance)}
                </ThemedText>
              </View>
            )}

            <ThemedText type="body" style={styles.inputLabel}>Payment Amount</ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>KES</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <ThemedText type="body" style={styles.inputLabel}>Payment Method</ThemedText>
            <View style={styles.paymentMethodGrid}>
              {PAYMENT_OPTIONS.map((method) => (
                <Pressable
                  key={method.id}
                  onPress={() => setPaymentMethod(method.id)}
                  style={[
                    styles.paymentMethodOption,
                    {
                      backgroundColor: paymentMethod === method.id ? Colors.primary.main : theme.surface,
                      borderColor: paymentMethod === method.id ? Colors.primary.main : theme.divider,
                    },
                  ]}
                >
                  <Feather
                    name={method.icon as any}
                    size={20}
                    color={paymentMethod === method.id ? "#FFFFFF" : Colors.primary.main}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      color: paymentMethod === method.id ? "#FFFFFF" : theme.text,
                      marginTop: 4,
                    }}
                  >
                    {method.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="body" style={styles.inputLabel}>Reference Number (Optional)</ThemedText>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="e.g., M-Pesa code"
              placeholderTextColor={theme.textSecondary}
            />

            <ThemedText type="body" style={styles.inputLabel}>Notes (Optional)</ThemedText>
            <TextInput
              style={[styles.textInput, styles.notesInput, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
              value={paymentNotes}
              onChangeText={setPaymentNotes}
              placeholder="Add any notes..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />

            <Button
              onPress={handleRecordPayment}
              loading={isProcessing}
              disabled={!paymentAmount || isProcessing}
              icon="check"
              size="large"
              style={{ marginTop: Spacing.lg }}
            >
              Record Payment
            </Button>
          </View>
        </View>
      </Modal>
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
  totalDebtCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  totalDebtHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchSection: {
    marginBottom: Spacing.lg,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.lg,
  },
  customersList: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  customerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  creditBar: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 2,
    overflow: "hidden",
  },
  creditBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  balanceSection: {
    alignItems: "flex-end",
  },
  detailPanel: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  balanceCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  emptyHistory: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  customerSummary: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    height: 56,
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  textInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  paymentMethodGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  paymentMethodOption: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
  },
});
