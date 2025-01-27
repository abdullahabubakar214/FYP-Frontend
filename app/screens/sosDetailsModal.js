import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SosDetailsModal = ({ isVisible, onClose, sosDetails }) => {
  const router = useRouter();

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>SOS Details</Text>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Message: </Text>
            {sosDetails.message}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Circle: </Text>
            {sosDetails.circle || "N/A"}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Location: </Text>
            {sosDetails.location || "Fetching..."}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.label}>Emergency Type: </Text>
            {sosDetails.emergencyType}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/screens/NearbyServices2")}
          >
            <Ionicons name="location-outline" size={30} color="#FFF" />
            <Text style={styles.iconText}>Nearby</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/screens/chatbot")}
          >
            <Ionicons name="chatbubbles-outline" size={30} color="#FFF" />
            <Text style={styles.iconText}>Chatbot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/screens/userSos")}
          >
            <Ionicons name="alert-circle-outline" size={30} color="#FFF" />
            <Text style={styles.iconText}>Your SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/screens/home")}
          >
            <Ionicons name="home-outline" size={30} color="#FFF" />
            <Text style={styles.iconText}>Home</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF8852",
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  detailsContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 30,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
    color: "#555",
  },
  label: {
    fontWeight: "bold",
    color: "#FF8852",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  iconButton: {
    width: "45%",
    backgroundColor: "#FF8852",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    elevation: 4,
  },
  iconText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
    textTransform: "uppercase",
  },
  closeButton: {
    padding: 15,
    backgroundColor: "#FF7043",
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SosDetailsModal;
