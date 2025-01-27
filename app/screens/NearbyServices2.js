import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ServiceDetails from './ServiceDetails'; // Import the ServiceDetails component
import { BackHandler } from "react-native";

const GOOGLE_API_KEY = "AIzaSyDFJEvaACmemBBmfa8RprG8Ojf8YlbEdAs";

const NearbyServices = () => {
  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const commonServices = ["hospital", "police", "fire_station"];
  
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
    })();
  }, []);

    useEffect(() => {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
  
      return () => {
          backHandler.remove();
      };
  }, []);
  
  const handleBackPress = () => {
    router.push("/screens/home"); 
    return true; // Prevent default behavior
  };
  

  const findNearbyServices = async (serviceType) => {
    if (location) {
      setLoading(true);
      const googlePlacesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=10000&type=${serviceType}&key=${GOOGLE_API_KEY}`;

      try {
        const response = await axios.get(googlePlacesUrl);
        const serviceData = await Promise.all(
          response.data.results.map(async (place) => {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_API_KEY}`;
            const detailsResponse = await axios.get(detailsUrl);
            const details = detailsResponse.data.result;

            return {
              id: place.place_id,
              name: details.name,
              address: details.formatted_address,
              phone: details.formatted_phone_number || "No contact info",
              website: details.website || "No website",
              rating: details.rating || "No rating",
              distance: `${calculateDistance(location.latitude, location.longitude, place.geometry.location.lat, place.geometry.location.lng).toFixed(2)} km`,
            };
          })
        );

        setServices(serviceData);
      } catch (error) {
        console.error(`Error fetching ${serviceType}:`, error);
        alert(`Error fetching nearby ${serviceType}.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of Earth in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (R * c) / 1000; // Distance in kilometers
  };

  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeDetailsModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleSearch = async () => {
    if (location && searchQuery) {
      setLoading(true);
      const googlePlacesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&location=${location.latitude},${location.longitude}&radius=10000&key=${GOOGLE_API_KEY}`;

      try {
        const response = await axios.get(googlePlacesUrl);
        const serviceData = await Promise.all(
          response.data.results.map(async (place) => {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_API_KEY}`;
            const detailsResponse = await axios.get(detailsUrl);
            const details = detailsResponse.data.result;

            return {
              id: place.place_id,
              name: details.name,
              address: details.formatted_address,
              phone: details.formatted_phone_number || "No contact info",
              website: details.website || "No website",
              rating: details.rating || "No rating",
              distance: `${calculateDistance(location.latitude, location.longitude, place.geometry.location.lat, place.geometry.location.lng).toFixed(2)} km`,
            };
          })
        );

        setServices(serviceData);
      } catch (error) {
        console.error("Error fetching search results:", error);
        alert("Error fetching search results.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
  {/* Notebox */}
  <View style={styles.notebox}>
    <Text style={styles.noteboxText}>
      Search for services or select from common options below.
    </Text>
  </View>

  <TextInput
    style={styles.searchInput}
    placeholder="Search services..."
    value={searchQuery}
    onChangeText={setSearchQuery}
  />
  <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
    <Text style={styles.searchButtonText}>Search</Text>
  </TouchableOpacity>

  <View style={styles.tagContainer}>
    {commonServices.map((service) => (
      <TouchableOpacity
        key={service}
        style={styles.serviceTag}
        onPress={() => findNearbyServices(service)}
      >
        <Text style={styles.tagText}>
          {service.replace("_", " ").toUpperCase()}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  {loading ? <ActivityIndicator size="large" color="#FF8852" /> : null}
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
    transparent={false}
    animationType="slide"
    onRequestClose={closeDetailsModal}
  >
    <ServiceDetails item={selectedItem} onClose={closeDetailsModal} />
  </Modal>

  <TouchableOpacity style={styles.closeButton} onPress={() => router.push('/screens/home')}>
    <Text style={styles.closeButtonText}>Close</Text>
  </TouchableOpacity>
</View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 40,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: "#FF8852",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  serviceTag: {
    backgroundColor: "#FF8852",
    padding: 10,
    borderRadius: 8,
    margin: 5,
  },
  tagText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listItemContent: {
    marginLeft: 10,
  },
  serviceName: {
    fontWeight: "bold",
  },
  address: {
    color: "#555",
  },
  distance: {
    color: "#888",
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
  },
  notebox: {
    backgroundColor: '#ffebcc', // Light yellow background
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffa500', // Orange border
    alignItems: 'center', // Center the text
  },
  
  noteboxText: {
    color: '#333', // Dark text color for contrast
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
});

export default NearbyServices;
