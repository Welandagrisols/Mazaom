import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Alert, Pressable, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { Customer } from "@/types";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type AddCustomerScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "AddCustomer">;
};

export default function AddCustomerScreen({ navigation }: AddCustomerScreenProps) {
  const { theme } = useTheme();
  const { addCustomer } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [customerType, setCustomerType] = useState<Customer["customerType"]>("retail");
  const [creditLimit, setCreditLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a customer name");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    setIsLoading(true);
    try {
      const success = await addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        customerType,
        creditLimit: parseFloat(creditLimit) || 0,
        currentBalance: 0,
        loyaltyPoints: 0,
      });

      if (success) {
        Alert.alert("Success", "Customer added successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", "Failed to add customer. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, phone, email, address, customerType, creditLimit, addCustomer, navigation]);

  const customerTypes: { key: Customer["customerType"]; label: string }[] = [
    { key: "retail", label: "Retail" },
    { key: "wholesale", label: "Wholesale" },
    { key: "vip", label: "VIP" },
  ];

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Customer Name *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., John Mwangi"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Phone Number *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="+254712345678"
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Email (Optional)
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Address (Optional)
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text },
          ]}
          value={address}
          onChangeText={setAddress}
          placeholder="Customer address"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Customer Type
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {customerTypes.map((type) => (
            <Pressable
              key={type.key}
              onPress={() => setCustomerType(type.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: customerType === type.key ? Colors.primary.main : theme.surface,
                  borderColor: customerType === type.key ? Colors.primary.main : theme.divider,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: customerType === type.key ? "#FFFFFF" : theme.text }}
              >
                {type.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Credit Limit (KES)
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
          value={creditLimit}
          onChangeText={setCreditLimit}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
        />
      </View>

      <Button onPress={handleSubmit} loading={isLoading} icon="user-plus" style={styles.submitButton}>
        Add Customer
      </Button>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  chipScroll: {
    paddingRight: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
