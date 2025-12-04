import React, { useMemo } from "react";
import { View, StyleSheet, Share, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { PAYMENT_METHODS } from "@/constants/categories";
import { POSStackParamList } from "@/navigation/POSStackNavigator";

type TransactionDetailScreenProps = {
  navigation: NativeStackNavigationProp<POSStackParamList, "TransactionDetail">;
  route: RouteProp<POSStackParamList, "TransactionDetail">;
};

export default function TransactionDetailScreen({ route }: TransactionDetailScreenProps) {
  const { theme } = useTheme();
  const { transactions } = useApp();

  const transaction = useMemo(() => {
    return transactions.find((t) => t.id === route.params.transactionId);
  }, [transactions, route.params.transactionId]);

  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === transaction?.paymentMethod);

  const handleShare = async () => {
    if (!transaction) return;

    const receipt = `
AgroVet POS Receipt
-------------------
Transaction: ${transaction.transactionNumber}
Date: ${formatDateTime(transaction.transactionDate)}

Items:
${transaction.items.map((item) => `${item.productName} x${item.quantity} - ${formatCurrency(item.total)}`).join("\n")}

Subtotal: ${formatCurrency(transaction.subtotal)}
${transaction.discount > 0 ? `Discount: -${formatCurrency(transaction.discount)}` : ""}
Total: ${formatCurrency(transaction.total)}

Payment: ${paymentMethod?.name || transaction.paymentMethod}
${transaction.customerName ? `Customer: ${transaction.customerName}` : ""}

Thank you for shopping with us!
    `.trim();

    try {
      await Share.share({ message: receipt });
    } catch (error) {
      Alert.alert("Error", "Failed to share receipt");
    }
  };

  if (!transaction) {
    return (
      <ScreenScrollView>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h4" style={{ marginTop: Spacing.md }}>
            Transaction not found
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={[styles.header, { backgroundColor: Colors.primary.main }]}>
        <Feather name="check-circle" size={48} color="#FFFFFF" />
        <ThemedText type="h2" style={styles.headerTitle}>
          {formatCurrency(transaction.total)}
        </ThemedText>
        <ThemedText type="body" style={styles.headerSubtitle}>
          {transaction.transactionNumber}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Transaction Details
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.detailRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Date & Time
            </ThemedText>
            <ThemedText type="body">{formatDateTime(transaction.transactionDate)}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Payment Method
            </ThemedText>
            <View style={styles.paymentBadge}>
              <Feather
                name={paymentMethod?.icon as any || "credit-card"}
                size={14}
                color={Colors.primary.main}
              />
              <ThemedText type="body" style={{ marginLeft: 4 }}>
                {paymentMethod?.name || transaction.paymentMethod}
              </ThemedText>
            </View>
          </View>
          <View style={styles.detailRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Status
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    transaction.paymentStatus === "completed"
                      ? Colors.badges.inStock.bg
                      : Colors.badges.lowStock.bg,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color:
                    transaction.paymentStatus === "completed"
                      ? Colors.badges.inStock.text
                      : Colors.badges.lowStock.text,
                  textTransform: "capitalize",
                }}
              >
                {transaction.paymentStatus}
              </ThemedText>
            </View>
          </View>
          {transaction.customerName ? (
            <View style={styles.detailRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Customer
              </ThemedText>
              <ThemedText type="body">{transaction.customerName}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Items ({transaction.items.length})
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {transaction.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index < transaction.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider },
              ]}
            >
              <View style={styles.itemInfo}>
                <ThemedText type="body">{item.productName}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatCurrency(item.total)}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Summary
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.summaryRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Subtotal
            </ThemedText>
            <ThemedText type="body">{formatCurrency(transaction.subtotal)}</ThemedText>
          </View>
          {transaction.discount > 0 ? (
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: Colors.accent.success }}>
                Discount
              </ThemedText>
              <ThemedText type="body" style={{ color: Colors.accent.success }}>
                -{formatCurrency(transaction.discount)}
              </ThemedText>
            </View>
          ) : null}
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.summaryRow}>
            <ThemedText type="h4">Total</ThemedText>
            <ThemedText type="h3" style={{ color: Colors.primary.main }}>
              {formatCurrency(transaction.total)}
            </ThemedText>
          </View>
        </View>
      </View>

      {transaction.notes ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Notes
          </ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {transaction.notes}
            </ThemedText>
          </View>
        </View>
      ) : null}

      <Button onPress={handleShare} icon="share" variant="outline" style={styles.shareButton}>
        Share Receipt
      </Button>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    color: "#FFFFFF",
    marginTop: Spacing.md,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.xs,
  },
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
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  shareButton: {
    marginBottom: Spacing.xl,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
});
