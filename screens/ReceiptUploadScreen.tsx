import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Image, ScrollView, ActivityIndicator, Alert, Switch } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { InventoryStackParamList } from "@/navigation/InventoryStackNavigator";
import { extractReceiptData, isOpenAIConfigured, ExtractedReceiptData } from "@/utils/openaiVision";
import { useApp } from "@/context/AppContext";
import { ReceiptProcessingMode } from "@/types";
import { ReceiptStorage } from "@/utils/storage";

type ReceiptUploadScreenProps = {
  navigation: NativeStackNavigationProp<InventoryStackParamList, "ReceiptUpload">;
  route?: { params?: { receiptId?: string; receiptImageUrl?: string } };
};

export default function ReceiptUploadScreen({ navigation, route }: ReceiptUploadScreenProps) {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const { processReceiptData } = useApp();

  const [selectedImage, setSelectedImage] = useState<string | null>(route?.params?.receiptImageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingToInventory, setIsAddingToInventory] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const [processingMode, setProcessingMode] = useState<ReceiptProcessingMode>("historical");
  const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(route?.params?.receiptId || null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  useEffect(() => {
    const loadReceiptData = async () => {
      const receiptId = route?.params?.receiptId;
      if (receiptId) {
        setIsLoadingReceipt(true);
        try {
          const receipt = await ReceiptStorage.getById(receiptId);
          if (receipt && receipt.extractedData?.items && receipt.extractedData.items.length > 0) {
            const convertedData: ExtractedReceiptData = {
              items: receipt.extractedData.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.total,
                unit: "units",
              })),
              supplierName: receipt.extractedData.supplierName,
              receiptNumber: receipt.extractedData.invoiceNumber,
              date: receipt.extractedData.invoiceDate,
              total: receipt.extractedData.totalAmount,
            };
            setExtractedData(convertedData);
            setSelectedImage(receipt.imageUrl);
            setCurrentReceiptId(receipt.id);
          }
        } catch (error) {
          console.error("Error loading receipt data:", error);
        } finally {
          setIsLoadingReceipt(false);
        }
      }
    };

    loadReceiptData();
  }, [route?.params?.receiptId]);

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload receipts.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setExtractedData(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your camera to take photos of receipts.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setExtractedData(null);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setExtractedData(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const processReceipt = async () => {
    if (!selectedImage) return;

    if (!isOpenAIConfigured()) {
      Alert.alert(
        "API Key Required",
        "OpenAI API key is not configured. Please add your OPENAI_API_KEY in the Secrets tab to enable AI-powered receipt scanning.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Starting receipt extraction for image:", selectedImage);
      const data = await extractReceiptData(selectedImage);
      console.log("Extraction successful:", data);
      
      if (!data || !data.items || data.items.length === 0) {
        Alert.alert(
          "No Data Found",
          "Could not extract any items from the receipt. Please ensure the image is clear and contains visible product information, or enter data manually."
        );
        setIsProcessing(false);
        return;
      }
      
      setExtractedData(data);
    } catch (error) {
      console.error("Receipt processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      Alert.alert(
        "Processing Error", 
        `Failed to extract data from the receipt:\n\n${errorMessage}\n\nPlease ensure:\n- The image is clear and well-lit\n- Text is readable\n- You have a valid OpenAI API key in Secrets`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const addToInventory = async () => {
    if (!extractedData) return;

    const modeText = processingMode === "historical" 
      ? "This will add price history records but NOT add quantities to your current stock."
      : "This will add items to your current stock inventory.";

    Alert.alert(
      processingMode === "historical" ? "Add Historical Data" : "Add to Current Stock",
      `${extractedData.items.length} item(s) will be processed.\n\n${modeText}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Continue", 
          onPress: async () => {
            setIsAddingToInventory(true);
            try {
              const result = await processReceiptData(extractedData, processingMode);

              const stockMessage = processingMode === "current_stock" 
                ? `\nStock added: ${result.stockAdded} units`
                : "";

              // Update receipt status to confirmed if we have a receiptId
              if (currentReceiptId) {
                try {
                  const receipt = await ReceiptStorage.getById(currentReceiptId);
                  if (receipt) {
                    await ReceiptStorage.update({
                      ...receipt,
                      status: "confirmed",
                    });
                  }
                } catch (updateError) {
                  console.error("Error updating receipt status:", updateError);
                }
              }

              // Clear the selection immediately
              clearSelection();
              
              // Show success message and navigate back
              Alert.alert(
                "Success!",
                `Receipt processed successfully!\n\nNew products: ${result.newProductsCreated}\nUpdated products: ${result.existingProductsUpdated}\nPrice records added: ${result.priceRecordsAdded}${stockMessage}\n\n${processingMode === "historical" ? "Price history recorded" : "Items added to inventory"}`,
                [{ 
                  text: "OK", 
                  onPress: () => {
                    // Navigate back to the previous screen (close modal)
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    }
                  }
                }]
              );
            } catch (error) {
              console.error("Error processing receipt:", error);
              const errorMessage = error instanceof Error ? error.message : "Failed to process receipt";
              Alert.alert("Error", `Failed to process receipt: ${errorMessage}`);
            } finally {
              setIsAddingToInventory(false);
            }
          }
        },
      ]
    );
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setExtractedData(null);
  };

  if (isLoadingReceipt) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <ThemedText type="body" style={{ marginTop: Spacing.md }}>
          Loading receipt data...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <View style={styles.uploadSection}>
            <View style={[styles.uploadBox, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
              <Feather name="upload-cloud" size={48} color={Colors.primary.main} />
              <ThemedText type="h4" style={styles.uploadTitle}>
                Upload Receipt
              </ThemedText>
              <ThemedText type="body" style={[styles.uploadDescription, { color: theme.textSecondary }]}>
                Take a photo or upload an image of your purchase receipt to automatically extract product information
              </ThemedText>
            </View>

            <View style={styles.optionsContainer}>
              <Pressable
                onPress={takePhoto}
                style={({ pressed }) => [
                  styles.optionButton,
                  { backgroundColor: Colors.primary.main, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="camera" size={24} color="#FFFFFF" />
                <ThemedText type="body" style={styles.optionButtonText}>
                  Take Photo
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={pickFromGallery}
                style={({ pressed }) => [
                  styles.optionButton,
                  { backgroundColor: theme.surface, borderWidth: 1, borderColor: Colors.primary.main, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="image" size={24} color={Colors.primary.main} />
                <ThemedText type="body" style={[styles.optionButtonText, { color: Colors.primary.main }]}>
                  Choose from Gallery
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={pickDocument}
                style={({ pressed }) => [
                  styles.optionButton,
                  { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.divider, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="file-text" size={24} color={theme.text} />
                <ThemedText type="body" style={styles.optionButtonTextSecondary}>
                  Upload PDF/Document
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.previewSection}>
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="contain" />
              <Pressable
                onPress={clearSelection}
                style={[styles.clearButton, { backgroundColor: Colors.accent.error }]}
              >
                <Feather name="x" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {!extractedData && !isProcessing && (
              <Pressable
                onPress={processReceipt}
                style={({ pressed }) => [
                  styles.processButton,
                  { backgroundColor: Colors.primary.main, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Feather name="cpu" size={20} color="#FFFFFF" />
                <ThemedText type="body" style={styles.processButtonText}>
                  Extract Receipt Data
                </ThemedText>
              </Pressable>
            )}

            {isProcessing && (
              <View style={[styles.processingContainer, { backgroundColor: theme.surface }]}>
                <ActivityIndicator size="large" color={Colors.primary.main} />
                <ThemedText type="body" style={[styles.processingText, { color: theme.textSecondary }]}>
                  Analyzing receipt...
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Extracting product names, quantities, and prices
                </ThemedText>
              </View>
            )}

            {extractedData && (
              <View style={[styles.resultsContainer, { backgroundColor: theme.surface }]}>
                <View style={styles.resultsHeader}>
                  <Feather name="check-circle" size={24} color={Colors.accent.success} />
                  <ThemedText type="h4" style={styles.resultsTitle}>
                    Data Extracted
                  </ThemedText>
                </View>

                <View style={[styles.modeToggleContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={styles.modeToggleHeader}>
                    <Feather name="settings" size={18} color={Colors.primary.main} />
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      Processing Mode
                    </ThemedText>
                  </View>
                  <Pressable 
                    style={[
                      styles.modeOption, 
                      processingMode === "historical" && { backgroundColor: Colors.primary.light }
                    ]}
                    onPress={() => setProcessingMode("historical")}
                  >
                    <View style={styles.modeOptionContent}>
                      <Feather 
                        name={processingMode === "historical" ? "check-circle" : "circle"} 
                        size={20} 
                        color={processingMode === "historical" ? Colors.primary.main : theme.textSecondary} 
                      />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>Historical Data Only</ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          Records prices & suppliers without adding to stock
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable 
                    style={[
                      styles.modeOption, 
                      processingMode === "current_stock" && { backgroundColor: Colors.primary.light }
                    ]}
                    onPress={() => setProcessingMode("current_stock")}
                  >
                    <View style={styles.modeOptionContent}>
                      <Feather 
                        name={processingMode === "current_stock" ? "check-circle" : "circle"} 
                        size={20} 
                        color={processingMode === "current_stock" ? Colors.primary.main : theme.textSecondary} 
                      />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>Add to Current Stock</ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          Records prices and adds quantities to inventory
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                </View>

                {extractedData.supplierName && (
                  <View style={styles.resultRow}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>Supplier</ThemedText>
                    <ThemedText type="body">{extractedData.supplierName}</ThemedText>
                  </View>
                )}

                {extractedData.receiptNumber && (
                  <View style={styles.resultRow}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>Receipt #</ThemedText>
                    <ThemedText type="body">{extractedData.receiptNumber}</ThemedText>
                  </View>
                )}

                {extractedData.date && (
                  <View style={styles.resultRow}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>Date</ThemedText>
                    <ThemedText type="body">{extractedData.date}</ThemedText>
                  </View>
                )}

                <View style={[styles.itemsSection, { borderTopColor: theme.divider }]}>
                  <ThemedText type="body" style={styles.itemsTitle}>
                    Items Found ({extractedData.items.length})
                  </ThemedText>
                  {extractedData.items.map((item, index) => (
                    <View key={index} style={[styles.itemRow, { backgroundColor: theme.backgroundSecondary }]}>
                      <View style={styles.itemInfo}>
                        <ThemedText type="body" style={{ fontWeight: "600" }}>{item.name}</ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {item.quantity} {item.unit || "units"} @ KES {item.unitPrice.toLocaleString()}
                        </ThemedText>
                      </View>
                      <ThemedText type="body" style={{ color: Colors.primary.main, fontWeight: "600" }}>
                        KES {item.totalPrice.toLocaleString()}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {extractedData.total && (
                  <View style={[styles.totalRow, { borderTopColor: theme.divider }]}>
                    <ThemedText type="h4">Total</ThemedText>
                    <ThemedText type="h3" style={{ color: Colors.primary.main }}>
                      KES {extractedData.total.toLocaleString()}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <Pressable
                    onPress={clearSelection}
                    style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
                    disabled={isAddingToInventory}
                  >
                    <ThemedText type="body">Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={addToInventory}
                    style={[styles.actionButton, styles.primaryButton, { backgroundColor: Colors.primary.main, opacity: isAddingToInventory ? 0.7 : 1 }]}
                    disabled={isAddingToInventory}
                  >
                    {isAddingToInventory ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="plus" size={18} color="#FFFFFF" />
                        <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                          {processingMode === "historical" ? "Add Price History" : "Add to Inventory"}
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  uploadSection: {
    flex: 1,
  },
  uploadBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: Spacing.xl,
  },
  uploadTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  uploadDescription: {
    textAlign: "center",
    lineHeight: 22,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  optionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  optionButtonTextSecondary: {
    fontWeight: "600",
  },
  previewSection: {
    flex: 1,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  imagePreview: {
    width: "100%",
    height: 300,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#000",
  },
  clearButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  processButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  processButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  processingContainer: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  processingText: {
    marginTop: Spacing.sm,
  },
  resultsContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  resultsTitle: {
    flex: 1,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  itemsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  itemsTitle: {
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  primaryButton: {
    flex: 2,
  },
  modeToggleContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modeToggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeOption: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  modeOptionContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
});