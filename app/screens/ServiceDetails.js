import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const ServiceDetails = ({ item, onClose }) => {
  if (!item) return null;

  const handleContact = (method, contact) => {
    if (method === 'whatsapp') {
      Linking.openURL(`https://wa.me/${contact}`);
    } else {
      Linking.openURL(`tel:${contact}`);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>{item.name}</Text>
        <Text style={styles.detailText}>Address: {item.address}</Text>
        <Text style={styles.detailText}>Contact: {item.phone}</Text>
        <Text style={styles.detailText}>Website: {item.website}</Text>
        <Text style={styles.detailText}>Rating: {item.rating}</Text>
        <Text style={styles.detailText}>Opening Hours: {item.openingHours}</Text>
        <Text style={styles.detailText}>Status: {item.openStatus}</Text>

        {item.reviews && item.reviews.length > 0 && (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewTitle}>Reviews:</Text>
            {item.reviews.map((review, index) => (
              <Text key={index} style={styles.reviewText}>
                {review.text}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.contactContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContact('phone', item.phone)}
          >
            <FontAwesome name="phone" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => handleContact('whatsapp', item.phone.replace(/\D/g, ''))}
          >
            <FontAwesome name="whatsapp" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  modalContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FF8852",
  },
  detailText: {
    fontSize: 18,
    marginBottom: 8,
    color: "#333",
  },
  reviewContainer: {
    marginTop: 10,
  },
  reviewTitle: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 5,
    color: "#FF8852",
  },
  reviewText: {
    marginVertical: 5,
    fontSize: 16,
    color: "#555",
  },
  contactContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    width: "40%",
    justifyContent: "center",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25D366",
    padding: 10,
    borderRadius: 8,
    width: "40%",
    justifyContent: "center",
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: "#FF8852",
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ServiceDetails;
