import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getSupabase, isSupabaseConfigured } from "@/utils/supabase";
import { AuthUser, UserRole } from "@/types";

interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
];

export default function UserManagementScreen() {
  const { theme } = useTheme();
  const { shop, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("cashier");
  const [isAddingUser, setIsAddingUser] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!isSupabaseConfigured() || !shop) {
      setUsers([
        {
          id: "1",
          email: "admin@mazao.com",
          fullName: "Shop Admin",
          role: "admin",
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          email: "cashier@mazao.com",
          fullName: "John Cashier",
          role: "cashier",
          active: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedUsers: UserListItem[] = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        active: u.active,
        createdAt: u.created_at,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsAddingUser(true);

    if (!isSupabaseConfigured()) {
      const newUser: UserListItem = {
        id: Date.now().toString(),
        email: newUserEmail.trim(),
        fullName: newUserName.trim(),
        role: newUserRole,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [newUser, ...prev]);
      setShowAddModal(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserRole("cashier");
      setIsAddingUser(false);
      Alert.alert("Success", "User added successfully (demo mode)");
      return;
    }

    const supabase = getSupabase();
    if (!supabase || !shop) {
      setIsAddingUser(false);
      Alert.alert("Error", "Unable to connect to database");
      return;
    }

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", newUserEmail.trim())
        .eq("shop_id", shop.id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingUser) {
        Alert.alert("Error", "A user with this email already exists in your shop");
        setIsAddingUser(false);
        return;
      }

      const { data: newUserData, error: insertError } = await supabase
        .from("users")
        .insert({
          email: newUserEmail.trim(),
          full_name: newUserName.trim(),
          shop_id: shop.id,
          role: newUserRole,
          active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newUser: UserListItem = {
        id: newUserData.id,
        email: newUserData.email,
        fullName: newUserData.full_name,
        role: newUserData.role,
        active: newUserData.active,
        createdAt: newUserData.created_at,
      };

      setUsers((prev) => [newUser, ...prev]);
      setShowAddModal(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserRole("cashier");
      
      Alert.alert(
        "User Added",
        `${newUserName} has been added to your team as ${newUserRole}. They will need to register with the same email address to access the app.`
      );
    } catch (error: any) {
      console.error("Error adding user:", error);
      Alert.alert("Error", error.message || "Failed to add user. Please try again.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      Alert.alert("Error", "You cannot deactivate your own account");
      return;
    }

    Alert.alert(
      currentStatus ? "Deactivate User" : "Activate User",
      `Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this user?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const newStatus = !currentStatus;
            
            setUsers((prev) =>
              prev.map((u) =>
                u.id === userId ? { ...u, active: newStatus } : u
              )
            );

            if (isSupabaseConfigured()) {
              const supabase = getSupabase();
              if (supabase) {
                try {
                  const { error } = await supabase
                    .from("users")
                    .update({ active: newStatus })
                    .eq("id", userId);

                  if (error) {
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === userId ? { ...u, active: currentStatus } : u
                      )
                    );
                    Alert.alert("Error", "Failed to update user status");
                  }
                } catch (error) {
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === userId ? { ...u, active: currentStatus } : u
                    )
                  );
                  Alert.alert("Error", "Failed to update user status");
                }
              }
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return Colors.accent.error;
      case "manager":
        return Colors.accent.warning;
      case "cashier":
        return Colors.primary.main;
      default:
        return Colors.secondary.main;
    }
  };

  const renderUserItem = ({ item }: { item: UserListItem }) => (
    <View
      style={[
        styles.userCard,
        { backgroundColor: theme.surface, opacity: item.active ? 1 : 0.6 },
      ]}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary.main }]}>
            <ThemedText style={styles.avatarText}>
              {item.fullName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        </View>
        <View style={styles.userDetails}>
          <ThemedText style={styles.userName}>{item.fullName}</ThemedText>
          <ThemedText style={styles.userEmail}>{item.email}</ThemedText>
          <View style={styles.roleRow}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: getRoleBadgeColor(item.role) + "20" },
              ]}
            >
              <ThemedText
                style={[styles.roleText, { color: getRoleBadgeColor(item.role) }]}
              >
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </ThemedText>
            </View>
            {!item.active && (
              <View style={[styles.statusBadge, { backgroundColor: Colors.accent.error + "20" }]}>
                <ThemedText style={[styles.statusText, { color: Colors.accent.error }]}>
                  Inactive
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
      {item.id !== currentUser?.id && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleUserStatus(item.id, item.active)}
        >
          <Feather
            name={item.active ? "user-x" : "user-check"}
            size={20}
            color={item.active ? Colors.accent.error : Colors.accent.success}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <RoleGuard requiredRole="admin" showAccessDenied>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Team Members</ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: Colors.primary.main }]}
            onPress={() => setShowAddModal(true)}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>Add User</ThemedText>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="users" size={48} color={theme.textSecondary} />
                <ThemedText style={styles.emptyText}>No team members yet</ThemedText>
              </View>
            }
          />
        )}

        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Add Team Member</ThemedText>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Feather name="x" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Full Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundSecondary, color: theme.text },
                  ]}
                  placeholder="Enter full name"
                  placeholderTextColor={theme.textSecondary}
                  value={newUserName}
                  onChangeText={setNewUserName}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundSecondary, color: theme.text },
                  ]}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.textSecondary}
                  value={newUserEmail}
                  onChangeText={setNewUserEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Role</ThemedText>
                <View style={styles.roleOptions}>
                  {ROLE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.roleOption,
                        {
                          backgroundColor:
                            newUserRole === option.value
                              ? Colors.primary.main
                              : theme.backgroundSecondary,
                        },
                      ]}
                      onPress={() => setNewUserRole(option.value)}
                    >
                      <ThemedText
                        style={[
                          styles.roleOptionText,
                          { color: newUserRole === option.value ? "#FFFFFF" : theme.text },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: Colors.primary.main }]}
                onPress={handleAddUser}
                disabled={isAddingUser}
              >
                {isAddingUser ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Add User</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    gap: Spacing.sm,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: Spacing.md,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontSize: 16,
  },
  roleOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  roleOptionText: {
    fontWeight: "500",
  },
  submitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
