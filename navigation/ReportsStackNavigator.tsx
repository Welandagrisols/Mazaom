import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReportsScreen from "@/screens/ReportsScreen";
import SalesReportScreen from "@/screens/SalesReportScreen";
import InventoryReportScreen from "@/screens/InventoryReportScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ReportsStackParamList = {
  Reports: undefined;
  SalesReport: undefined;
  InventoryReport: undefined;
};

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export default function ReportsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          headerTitle: "Reports",
        }}
      />
      <Stack.Screen
        name="SalesReport"
        component={SalesReportScreen}
        options={{
          headerTitle: "Sales Report",
        }}
      />
      <Stack.Screen
        name="InventoryReport"
        component={InventoryReportScreen}
        options={{
          headerTitle: "Inventory Report",
        }}
      />
    </Stack.Navigator>
  );
}
