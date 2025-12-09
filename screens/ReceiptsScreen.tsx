import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { MoreStackParamList } from "@/navigation/MoreStackNavigator";
import { ReceiptStorage, generateId, uploadReceiptImage } from "@/utils/storage";
import { ScannedReceipt } from "@/types";
import { extractReceiptData, isOpenAIConfigured } from "@/utils/openaiVision";

type ReceiptsScreenProps = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Receipts">;
};

export default function ReceiptsScreen({ navigation }: ReceiptsScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const [receipts, setReceipts] = useState<ScannedReceipt[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setIsLoading(true);
      const storedReceipts = await ReceiptStorage.getAll();
      setReceipts(storedReceipts);
    } catch (error) {
      console.error("Error loading receipts:", error);
      Alert.alert("Error", "Failed to load receipts from database.");
    } finally {
      setIsLoading(false);
    }
  };

  const createScannedReceipt = (uri: string, name: string): ScannedReceipt => {
    return {
      id: generateId(),
      receiptDate: new Date().toISOString().split("T")[0],
      imageUrl: uri,
      ocrMethod: "google_vision",
      confidenceScore: 0,
      status: "pending",
      extractedData: {
        items: [],
        supplierName: name,
      },
      createdAt: new Date().toISOString(),
    };
  };

  const pickPDFDocuments = useCallback(async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newReceipts: ScannedReceipt[] = [];

        for (const asset of result.assets) {
          const cloudUrl = await uploadReceiptImage(asset.uri);
          const receipt = createScannedReceipt(cloudUrl, asset.name);
          await ReceiptStorage.add(receipt);
          newReceipts.push(receipt);
        }

        setReceipts((prev) => [...newReceipts, ...prev]);
        Alert.alert(
          "Success",
          `${newReceipts.length} file(s) uploaded to cloud! Tap any receipt below to extract data with AI.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error picking documents:", error);
      Alert.alert("Error", "Failed to pick documents. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take photos of receipts."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
        aspect: [3, 4],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const asset = result.assets[0];
        const receiptName = `Receipt_${new Date().toISOString().slice(0, 10)}_${Date.now()}.jpg`;
        
        const cloudUrl = await uploadReceiptImage(asset.uri);
        const newReceipt = createScannedReceipt(cloudUrl, receiptName);

        await ReceiptStorage.add(newReceipt);
        setReceipts((prev) => [newReceipt, ...prev]);
        setIsUploading(false);
        Alert.alert("Success", "Receipt uploaded! Tap the receipt below to extract data with AI.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setIsUploading(false);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Gallery access is needed to select receipt images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const newReceipts: ScannedReceipt[] = [];

        for (const asset of result.assets) {
          const receiptName = asset.fileName || `Receipt_${Date.now()}.jpg`;
          const cloudUrl = await uploadReceiptImage(asset.uri);
          const receipt = createScannedReceipt(cloudUrl, receiptName);
          await ReceiptStorage.add(receipt);
          newReceipts.push(receipt);
        }

        setReceipts((prev) => [...newReceipts, ...prev]);
        setIsUploading(false);
        Alert.alert(
          "Success",
          `${newReceipts.length} image(s) uploaded! Tap any receipt below to extract data with AI.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error picking images:", error);
      setIsUploading(false);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  }, []);

  const processReceipts = useCallback(async () => {
    const pendingReceipts = receipts.filter((r) => r.status === "pending");
    if (pendingReceipts.length === 0) {
      Alert.alert("No Pending Receipts", "All receipts have been processed.");
      return;
    }

    if (!isOpenAIConfigured()) {
      Alert.alert(
        "API Key Required",
        "OpenAI API key is not configured. Please add your OPENAI_API_KEY in the Secrets tab to enable bulk AI extraction.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Bulk AI Extraction",
      `Extract data from ${pendingReceipts.length} receipt(s) using AI?\n\nEach receipt will be processed automatically. You can review and add to inventory afterward.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Process ${pendingReceipts.length}`,
          onPress: async () => {
            setIsUploading(true);
            let successCount = 0;
            let failCount = 0;

            for (const receipt of pendingReceipts) {
              try {
                const extractedData = await extractReceiptData(receipt.imageUrl);

                const updatedReceipt = {
                  ...receipt,
                  extractedData: {
                    items: extractedData.items.map(item => ({
                      name: item.name,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      total: item.totalPrice,
                      confidence: "high" as const,
                    })),
                    supplierName: extractedData.supplierName,
                    invoiceNumber: extractedData.receiptNumber,
                    invoiceDate: extractedData.date,
                    totalAmount: extractedData.total,
                  },
                  confidenceScore: 0.85,
                  status: "reviewed" as const,
                };

                await ReceiptStorage.update(updatedReceipt);
                setReceipts(prev => prev.map(r => r.id === receipt.id ? updatedReceipt : r));
                successCount++;
              } catch (error) {
                console.error("Error extracting data from receipt:", receipt.id, error);
                failCount++;
              }
            }

            setIsUploading(false);

            if (failCount === 0) {
              Alert.alert(
                "Success! 🎉",
                `${successCount} receipt(s) processed successfully!\n\nTap any receipt below to review extracted data and add to inventory.`,
                [{ text: "OK" }]
              );
            } else {
              Alert.alert(
                "Partial Success",
                `${successCount} receipt(s) processed successfully.\n${failCount} failed.\n\nTap receipts to review and add to inventory.`,
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  }, [receipts]);

  const deleteReceipt = useCallback((id: string) => {
    Alert.alert("Delete Receipt", "Are you sure you want to delete this receipt?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await ReceiptStorage.delete(id);
            setReceipts((prev) => prev.filter((r) => r.id !== id));
            Alert.alert("Success", "Receipt deleted successfully.");
          } catch (error) {
            console.error("Error deleting receipt:", error);
            Alert.alert("Error", "Failed to delete receipt.");
          }
        },
      },
    ]);
  }, []);

  const getStatusColor = (status: ScannedReceipt["status"]) => {
    switch (status) {
      case "pending":
        return Colors.accent.warning;
      case "reviewed":
        return Colors.primary.main;
      case "confirmed":
        return Colors.accent.success;
      default:
        return theme.textSecondary;
    }
  };

  const renderReceiptItem = ({ item }: { item: ScannedReceipt }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to Inventory stack's ReceiptUpload screen
        // This ensures consistent behavior with the inventory tab
        (navigation as any).navigate("InventoryStack", {
          screen: "ReceiptUpload",
          params: { receiptImageUrl: item.imageUrl }
        });
      }}
      activeOpacity={0.7}
    >
      <Card style={styles.receiptCard}>
        <View style={styles.receiptContent}>
          <View style={styles.receiptIcon}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumbnailImage} />
            ) : (
              <Feather name="file-text" size={28} color={Colors.primary.main} />
            )}
          </View>
          <View style={styles.receiptInfo}>
            <ThemedText type="body" numberOfLines={1} style={styles.receiptName}>
              {item.extractedData?.supplierName || `Receipt ${item.id.slice(0, 8)}`}
            </ThemedText>
            <View style={styles.receiptMeta}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {new Date(item.receiptDate).toLocaleDateString()}
              </ThemedText>
              {item.confidenceScore > 0 && (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {" "} - {Math.round(item.confidenceScore * 100)}% confidence
                </ThemedText>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
              <ThemedText
                type="small"
                style={{ color: getStatusColor(item.status), fontWeight: "600" }}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              deleteReceipt(item.id);
            }}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={20} color={Colors.accent.error} />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const pendingCount = receipts.filter((r) => r.status === "pending").length;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <ThemedText type="body" style={{ marginTop: Spacing.md }}>
          Loading receipts from database...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <ThemedText type="h3" style={styles.title}>
            Upload Receipts
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Capture or upload receipts - saved to Supabase database
          </ThemedText>
        </View>

        <View style={styles.actionCards}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.primary.light + "30" }]}
            onPress={takePhoto}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.primary.main }]}>
              <Feather name="camera" size={28} color="#FFFFFF" />
            </View>
            <ThemedText type="subtitle" style={styles.actionTitle}>
              Take Photo
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Capture receipt with camera
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.secondary.light + "30" }]}
            onPress={pickFromGallery}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.secondary.main }]}>
              <Feather name="image" size={28} color="#FFFFFF" />
            </View>
            <ThemedText type="subtitle" style={styles.actionTitle}>
              From Gallery
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Select multiple images
            </ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.uploadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={pickPDFDocuments}
          activeOpacity={0.7}
          disabled={isUploading}
        >
          <Feather name="upload-cloud" size={40} color={Colors.primary.main} />
          <ThemedText type="subtitle" style={{ marginTop: Spacing.md }}>
            {isUploading ? "Uploading..." : "Upload PDF Files"}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
            Select multiple PDF receipts or images at once for batch processing
          </ThemedText>
        </TouchableOpacity>

        {pendingCount > 0 && (
          <Button
            title={`Bulk Extract Data (${pendingCount})`}
            onPress={processReceipts}
            style={styles.processButton}
            icon="zap"
          />
        )}

        <View style={styles.receiptsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">
              Database Receipts ({receipts.length})
            </ThemedText>
            <TouchableOpacity onPress={loadReceipts} style={styles.refreshButton}>
              <Feather name="refresh-cw" size={20} color={Colors.primary.main} />
            </TouchableOpacity>
          </View>

          {receipts.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="No Receipts Yet"
              message="Take a photo or upload PDF files to get started. All receipts are saved to your Supabase database."
            />
          ) : (
            <FlatList
              data={receipts}
              renderItem={renderReceiptItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            />
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  actionCards: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  actionTitle: {
    marginBottom: Spacing.xs,
  },
  uploadCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  processButton: {
    marginBottom: Spacing.xl,
  },
  receiptsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  receiptCard: {
    padding: Spacing.md,
  },
  receiptContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  receiptIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptName: {
    fontWeight: "500",
    marginBottom: 2,
  },
  receiptMeta: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});
