import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InventoryScreen from "@/screens/InventoryScreen";
import ProductDetailScreen from "@/screens/ProductDetailScreen";
import AddOrRestockScreen from "@/screens/AddOrRestockScreen";
import ReceiptUploadScreen from "@/screens/ReceiptUploadScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type InventoryStackParamList = {
  Inventory: undefined;
  ProductDetail: { productId: string };
  AddOrRestock: undefined;
  ReceiptUpload: undefined;
};

const Stack = createNativeStackNavigator<InventoryStackParamList>();

export default function InventoryStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          headerTitle: "Inventory",
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          headerTitle: "Product Details",
        }}
      />
      <Stack.Screen
        name="AddOrRestock"
        component={AddOrRestockScreen}
        options={{
          headerTitle: "Add / Restock",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="ReceiptUpload"
        component={ReceiptUploadScreen}
        options={{
          headerTitle: "Upload Receipt",
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}
