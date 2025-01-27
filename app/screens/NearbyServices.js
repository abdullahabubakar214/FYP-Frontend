import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import axios from "axios";
import moment from "moment";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";

const NearbyServices = () => {
  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [radius, setRadius] = useState(50000); // Default to 50km
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const emergencyServices = [
    "police",
    "hospital",
    "pharmacy",
    "fire_station",
    "ambulance_station",
    "emergency_phone",
    "rescue_station",
    "clinic",
    "dentist",
    "doctor",
    "veterinary",
    "healthcare",
    "optician",
    "coast_guard",
    "defibrillator",
    "fuel",
    "charging_station",
    "shelter",
    "toilets",
    "supermarket",
    "convenience",
    "lifeguard",
    "mountain_rescue"
];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    })();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of Earth in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c) / 1000; // Distance in kilometers
  };

  const isServiceOpen = (openingHours) => {
    if (!openingHours || openingHours === "No opening hours info") {
      return "Unknown";
    }

    const currentDay = moment().format("ddd");
    const currentTime = moment().format("HH:mm");

    const hours = openingHours.split(";");
    for (const hour of hours) {
      if (hour.includes(currentDay)) {
        const times = hour.split(" ");
        const openCloseTimes = times[1].split("-");
        const openTime = openCloseTimes[0];
        const closeTime = openCloseTimes[1];

        if (currentTime >= openTime && currentTime <= closeTime) {
          return "Open";
        }
        return "Closed";
      }
    }

    return "Closed";
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const address = reverseGeocode[0];
      return `${address.name || "Unknown Place"}, ${
        address.city || "Unknown City"
      }, ${address.country || "Unknown Country"}`;
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Address not available";
    }
  };

  const findNearbyServices = async (amenity) => {
    if (location) {
      setLoading(true);
      setSelectedService(amenity);

      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radius},${location.latitude},${location.longitude})[amenity=${amenity}];out;`;

      try {
        const response = await axios.get(overpassUrl);
        const serviceData = await Promise.all(
          response.data.elements.map(async (service) => {
            const address = await getAddressFromCoords(
              service.lat,
              service.lon
            );
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              service.lat,
              service.lon
            ).toFixed(2);
            return {
              id: service.id,
              name:
                service.tags.name ||
                `Unnamed ${amenity.charAt(0).toUpperCase() + amenity.slice(1)}`,
              address: address,
              phone:
                service.tags.phone ||
                service.tags["contact:phone"] ||
                "No contact info",
              openingHours:
                service.tags.opening_hours || "No opening hours info",
              openStatus: isServiceOpen(service.tags.opening_hours),
              distance: `${distance} km`,
            };
          })
        );

        setServices(serviceData);
      } catch (error) {
        console.error(`Error fetching ${amenity}:`, error);
        setErrorMsg(`Error fetching nearby ${amenity}.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeDetailsModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="close-outline" size={28} marginTop={4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Services</Text>
      </View>
      <View style={styles.container}>
        <Picker
          selectedValue={radius}
          onValueChange={(itemValue) => setRadius(itemValue)}
          style={styles.radiusDropdown}
        >
          {[10, 20, 30, 50, 70, 100].map((km) => (
            <Picker.Item
              key={km}
              label={`${km} km`}
              value={km * 1000}
            />
          ))}
        </Picker>
        <View style={styles.buttonContainer}>
          {emergencyServices.map((service) => (
            <TouchableOpacity
              key={service}
              style={styles.serviceButton}
              onPress={() => findNearbyServices(service)}
            >
              <Text style={styles.buttonText}>
                {service.replace("_", " ").toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <ActivityIndicator size="large" color="#FF8852" /> : null}
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openDetailsModal(item)}
              style={styles.listItem}
            >
              <MaterialIcons name="location-on" size={24} color="#FF8852" />
              <View style={styles.listItemContent}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.address}>{item.address}</Text>
                <Text style={styles.distance}>{item.distance}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDetailsModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedItem && (
                <>
                  <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                  <Text>Address: {selectedItem.address}</Text>
                  <Text>Contact: {selectedItem.phone}</Text>
                  <Text>Opening Hours: {selectedItem.openingHours}</Text>
                  <Text>Status: {selectedItem.openStatus}</Text>
                  <View style={styles.contactContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(`tel:${selectedItem.phone}`)
                      }
                    >
                      <FontAwesome
                        name="phone"
                        size={24}
                        color="green"
                        style={styles.contactIcon}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          `whatsapp://send?phone=${selectedItem.phone}`
                        )
                      }
                    >
                      <FontAwesome
                        name="whatsapp"
                        size={24}
                        color="green"
                        style={styles.contactIcon}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeDetailsModal}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 40,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FF8852",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginRight: 60,
  },
  radiusDropdown: {
    width: 200,
    alignSelf: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  serviceButton: {
    backgroundColor: "#FF8852",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    marginBottom: 10,
  },
  listItemContent: {
    marginLeft: 10,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  address: {
    fontSize: 14,
    color: "#666",
  },
  distance: {
    fontSize: 12,
    color: "#333",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#FF8852",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  contactContainer: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "space-around",
  },
  contactIcon: {
    marginHorizontal: 10,
  },
});

export default NearbyServices;
