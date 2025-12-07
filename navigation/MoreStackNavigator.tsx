import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MoreScreen from "@/screens/MoreScreen";
import CustomersScreen from "@/screens/CustomersScreen";
import SuppliersScreen from "@/screens/SuppliersScreen";
import TransactionsScreen from "@/screens/TransactionsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import AddCustomerScreen from "@/screens/AddCustomerScreen";
import AddSupplierScreen from "@/screens/AddSupplierScreen";
import ReceiptsScreen from "@/screens/ReceiptsScreen";
import CustomerCreditsScreen from "@/screens/CustomerCreditsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type MoreStackParamList = {
  More: undefined;
  Customers: undefined;
  Suppliers: undefined;
  Transactions: undefined;
  Settings: undefined;
  AddCustomer: undefined;
  AddSupplier: undefined;
  Receipts: undefined;
  CustomerCredits: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="More"
        component={MoreScreen}
        options={{
          headerTitle: "More",
        }}
      />
      <Stack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          headerTitle: "Customers",
        }}
      />
      <Stack.Screen
        name="Suppliers"
        component={SuppliersScreen}
        options={{
          headerTitle: "Suppliers",
        }}
      />
      <Stack.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          headerTitle: "All Transactions",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="AddCustomer"
        component={AddCustomerScreen}
        options={{
          headerTitle: "Add Customer",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="AddSupplier"
        component={AddSupplierScreen}
        options={{
          headerTitle: "Add Supplier",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{
          headerTitle: "Upload Receipts",
        }}
      />
      <Stack.Screen
        name="CustomerCredits"
        component={CustomerCreditsScreen}
        options={{
          headerTitle: "Customer Credits",
        }}
      />
    </Stack.Navigator>
  );
}
