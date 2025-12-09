import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type AddSupplierScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "AddSupplier">;
};

export default function AddSupplierScreen({ navigation }: AddSupplierScreenProps) {
  const { theme } = useTheme();
  const { addSupplier } = useApp();

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a supplier name");
      return;
    }
    if (!contactPerson.trim()) {
      Alert.alert("Error", "Please enter a contact person");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }

    setIsLoading(true);
    try {
      const success = await addSupplier({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        active: true,
      });

      if (success) {
        Alert.alert("Success", "Supplier added successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Error", "Failed to add supplier. Please try again.");
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [name, contactPerson, phone, email, address, paymentTerms, addSupplier, navigation]);

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Company Name *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Unga Holdings Ltd"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Contact Person *
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
          value={contactPerson}
          onChangeText={setContactPerson}
          placeholder="e.g., James Kamau"
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
          placeholder="+254720111222"
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
          placeholder="supplies@company.co.ke"
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
          placeholder="Supplier address"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Payment Terms (Optional)
        </ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.divider, color: theme.text }]}
          value={paymentTerms}
          onChangeText={setPaymentTerms}
          placeholder="e.g., Net 30"
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      <Button onPress={handleSubmit} loading={isLoading} icon="truck" style={styles.submitButton}>
        Add Supplier
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
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
