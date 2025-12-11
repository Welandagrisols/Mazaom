import React, { useState } from "react";
import { View, StyleSheet, Alert, Switch } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { MenuListItem } from "@/components/MenuListItem";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { clearAllData } from "@/utils/storage";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Settings">;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme } = useTheme();
  const { user, logout, loadData } = useApp();

  const [isClearing, setIsClearing] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          Alert.alert("Success", "You have been logged out");
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      "Warning: Delete All Data",
      "This will PERMANENTLY delete ALL your data including:\n\n- All products\n- All customers\n- All suppliers\n- All transactions\n- All inventory records\n\nThis action CANNOT be undone. Your app will be completely empty after this.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I Understand, Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Are you absolutely sure? All data will be permanently deleted and cannot be recovered.",
              [
                { text: "No, Keep My Data", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setIsClearing(true);
                    try {
                      await clearAllData();
                      Alert.alert("Data Deleted", "All data has been permanently deleted. The app is now empty.");
                    } catch (error) {
                      Alert.alert("Error", "Failed to clear data");
                    } finally {
                      setIsClearing(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary.light + "20" }]}>
            <Feather name="user" size={24} color={Colors.primary.main} />
          </View>
          <View style={styles.userInfo}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {user?.fullName || "Guest User"}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {user?.email || "Not logged in"}
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Preferences
      </ThemedText>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Feather name="bell" size={20} color={Colors.primary.main} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
              Notifications
            </ThemedText>
          </View>
          <Switch
            value={true}
            trackColor={{ false: theme.divider, true: Colors.primary.light }}
            thumbColor={Colors.primary.main}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Feather name="volume-2" size={20} color={Colors.primary.main} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
              Sound Effects
            </ThemedText>
          </View>
          <Switch
            value={true}
            trackColor={{ false: theme.divider, true: Colors.primary.light }}
            thumbColor={Colors.primary.main}
          />
        </View>
      </View>

      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        About
      </ThemedText>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.aboutRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Version
          </ThemedText>
          <ThemedText type="body">1.0.0</ThemedText>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <View style={styles.aboutRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Build
          </ThemedText>
          <ThemedText type="body">2024.12.04</ThemedText>
        </View>
      </View>

      <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Data Management
      </ThemedText>
      <MenuListItem
        title="Clear All Data"
        subtitle="Delete all local data"
        icon="trash-2"
        iconColor={Colors.accent.error}
        destructive
        showChevron={false}
        onPress={handleClearData}
      />

      <Button
        onPress={handleLogout}
        variant="outline"
        icon="log-out"
        style={styles.logoutButton}
      >
        Logout
      </Button>

      <View style={styles.footer}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          AgroVet POS System
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Powered by Replit
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  logoutButton: {
    marginTop: Spacing.xl,
  },
  footer: {
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
});
