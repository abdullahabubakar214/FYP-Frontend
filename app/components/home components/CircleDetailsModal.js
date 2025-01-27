import React from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, Share, Clipboard } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for share icon

const CircleDetailsModal = ({ visible, onClose, circle }) => {
  if (!circle) {
    return null;
  }

  // Function to share the circle code
  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my circle using this code: ${circle.circleCode}`, // Use circleCode for sharing
      });
    } catch (error) {
      console.log("Error sharing code:", error);
    }
  };

  // Function to copy the circle code to clipboard
  const handleCopyCode = async () => {
    await Clipboard.setString(circle.circleCode);
    alert("Circle code copied to clipboard!");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Circle Details</Text>
          <View style={styles.circleCodeContainer}>
            <Text style={styles.circleCodeText}>{circle.circleCode}</Text>
            <TouchableOpacity onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={24} color="#FF8852" />
            </TouchableOpacity>
          </View>

          <Text style={styles.instructionText}>
            Share this code to add members to your circle!
          </Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
            <Ionicons name="share-social-outline" size={24} color="white" />
            <Text style={styles.shareButtonText}>Share Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 350, // Increase the width of the modal
    padding: 30, // Increase the padding
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 30, // Increase the title font size
    fontWeight: "bold",
    marginBottom: 15,
  },
  circleCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  circleCodeText: {
    fontSize: 24, // Larger font size for the circle code
    fontWeight: "bold", // Bold text
    color: "#FF8852", // Darker color for better visibility
    marginRight: 10, // Space between text and icon
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF8852",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  shareButtonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 5, // Space between icon and text
  },
  closeButton: {
    backgroundColor: "#FF8852",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default CircleDetailsModal;
