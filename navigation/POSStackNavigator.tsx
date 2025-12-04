import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import POSScreen from "@/screens/POSScreen";
import CheckoutScreen from "@/screens/CheckoutScreen";
import TransactionDetailScreen from "@/screens/TransactionDetailScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type POSStackParamList = {
  POS: undefined;
  Checkout: undefined;
  TransactionDetail: { transactionId: string };
};

const Stack = createNativeStackNavigator<POSStackParamList>();

export default function POSStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="POS"
        component={POSScreen}
        options={{
          headerTitle: () => <HeaderTitle title="AgroVet POS" />,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerTitle: "Checkout",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          headerTitle: "Transaction Details",
        }}
      />
    </Stack.Navigator>
  );
}
