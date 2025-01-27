import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Image,
  Linking,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import CircleDropdown from "../components/home components/CircleDropdown";
import ContactBottomSheet from "../components/home components/ContactBottomSheet";
import SosScreen from "./sosScreen";
import { Ionicons } from "@expo/vector-icons";
import CircleDetailsModal from "../components/home components/CircleDetailsModal";
import SOSDetailsModal from "../components/home components/sosDetailsModal";
import { Share } from 'react-native';
import {
  fetchContactsInCircle,
  fetchCreatedCircles,
  fetchJoinedCircles,
} from "../services/circleServices";
import { auth } from "../firebase/firebaseauth";
import ProfileModal from "./ProfileScreen";
import ChatbotScreen from "./chatbot";
import LottieView from 'lottie-react-native'; // Import Lottie
import { BackHandler } from "react-native";


const HomeScreen = () => {
  const [mapType, setMapType] = useState("standard");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [region, setRegion] = useState({});
  const [locationText, setLocationText] = useState("");
  const [contacts, setContacts] = useState([]);
  const [isSheetVisible, setSheetVisible] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [createdCircles, setCreatedCircles] = useState([]);
  const [joinedCircles, setJoinedCircles] = useState([]);
  const [customMarker, setCustomMarker] = useState(null); // Step 1: Add state for custom marker
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [isSosModalVisible, setSosModalVisible] = useState(false);
  const [isCircleDetailsModalVisible, setCircleDetailsModalVisible] = useState(false);
  const [circleDetails, setCircleDetails] = useState(null);
  const [isSosDetailsModalVisible, setSosDetailsModalVisible] = useState(false);
  const { contactLocation } = useLocalSearchParams(); // Accept the passed parameters
  const mapRef = useRef(null);
  const [isNoteVisible, setIsNoteVisible] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Only set region if valid coordinates are obtained
      if (latitude && longitude) {
        setCurrentLocation({
          latitude,
          longitude,
        });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        fetchLocationText(latitude, longitude);
      } else {
        console.error("Invalid location data received");
      }
    })();
  }, []);

  useEffect(() => {
    const backAction = () => {
      // Show exit confirmation if the user is at the root screen
      Alert.alert("Exit App", "Are you sure you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => BackHandler.exitApp() },
      ]);
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // Cleanup on unmount
  }, []);

  useEffect(() => {
    // Monitor auth state and fetch user circles
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const [created, joined] = await Promise.all([
            fetchCreatedCircles(user.uid),
            fetchJoinedCircles(user.uid),
          ]);
          setCreatedCircles(created.data || []);
          setJoinedCircles(joined.data || []);
        } catch (error) {
          console.error("Failed to load circles:", error);
        }
      } else {
        // Clear circles if user is logged out
        setCreatedCircles([]);
        setJoinedCircles([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Show the note when the Home screen renders
    setIsNoteVisible(true);

    // Set a timer to hide the note after 10 seconds
    const timer = setTimeout(() => {
      setIsNoteVisible(false);
    }, 10000);

    // Cleanup timer on unmount or when the component re-renders
    return () => clearTimeout(timer);
  }, []);


  const fetchLocationText = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=671be423c3cde679070422nrv79416b`);

      // Log response status and text
      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);

      // Check if the response is OK (status 200)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(text); // Parse the text to JSON
      if (data && data.display_name) {
        setLocationText(data.display_name); // Set location text
      }
    } catch (error) {
      console.error("Failed to fetch location text:", error);
    }
  };


  const handleShareLocation = async () => {
    if (currentLocation && locationText) {
      const { latitude, longitude } = currentLocation;
      const message = `I'm currently at: ${locationText}\nView on Google Maps: https://www.google.com/maps/?q=${latitude},${longitude}`;

      try {
        await Share.share({
          message,
        });
      } catch (error) {
        console.error("Error sharing location:", error);
      }
    } else {
      Alert.alert("Location not available", "Unable to share your location at this time.");
    }
  };

  useEffect(() => {
    if (contactLocation) {
      const { latitude, longitude, name } = JSON.parse(contactLocation);
      // Call addCustomMarker directly to ensure consistency
      addCustomMarker(name, latitude, longitude);
    }
  }, [contactLocation]);

  const addCustomMarker = (name, latitude, longitude) => {
    if (!selectedCircle) {
      // Ensure longitude and latitude are valid
      if (latitude && longitude) {
        setCustomMarker({ name, latitude, longitude });

        const markerRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01, // Adjust the zoom level if needed
          longitudeDelta: 0.01,
        };

        // Update region state synchronously
        setRegion(markerRegion);

        // Animate the map to the new region
        if (mapRef.current) {
          mapRef.current.animateToRegion(markerRegion, 1000); // Smooth transition
        }
      } else {
        console.error("Invalid latitude or longitude for custom marker");
      }
    }
  };

  const handleShowContactBottomSheet = () => {
    setSheetVisible(true);
  };

  const handleProfileImageUpdate = (imageUri) => {
    setUserProfileImage(imageUri);
  };

  const handleSelectCircle = async (circle) => {
    setSelectedCircle(circle);
    setLoadingContacts(true);

    try {
      const response = await fetchContactsInCircle(circle._id);
      if (!response.success) {
        console.error("Error fetching contacts:", response.message);
        setContacts([]);
        return;
      }

      const circleContacts = response.data.contacts || [];
      setContacts(circleContacts);

      setSheetVisible(true);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const toggleMapType = () => {
    setMapType((prevType) => {
      switch (prevType) {
        case "standard":
          return "satellite";
        case "satellite":
          return "terrain";
        case "terrain":
          return "hybrid";
        case "hybrid":
        default:
          return "standard";
      }
    });
  };

  const handleActiveSosPress = () => {
    setSosDetailsModalVisible(true);
  };

  const handleAddPersonPress = () => {
    setCircleDetails(selectedCircle);
    setCircleDetailsModalVisible(true);
    // if (selectedCircle) {
    //   // Check if the selected circle is in the created circles array
    //   const isCreatedCircle = createdCircles.some(circle => circle._id === selectedCircle._id);

    //   if (isCreatedCircle) {
    //     setCircleDetails(selectedCircle);
    //     setCircleDetailsModalVisible(true);
    //   } else {
    //     Alert.alert("You are not an admin!", "You cannot add a person to this circle.");
    //   }
    // } else {
    //   Alert.alert("No circle selected", "Please select a circle first.");
    // }
  };

  // Function to handle opening the chatbot screen
  const handleChatbotPress = () => {
    router.push("/screens/chatbot");
  };


  return (
    <View style={styles.container}>
      {/* Top Toolbar */}
      <View style={styles.topToolbar}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => router.push("/screens/SettingsScreen")}
        >
          <Icon name="settings" size={20} color="#FF8852" />
        </TouchableOpacity>
        <CircleDropdown
          onSelectCircle={handleSelectCircle}
          createdCircles={createdCircles}
          joinedCircles={joinedCircles}
          loadingCircles={loadingCircles}
        />
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={handleAddPersonPress}
        >
          <Ionicons name="person-add-outline" size={20} color="#FF8852" />
        </TouchableOpacity>
      </View>
      {isNoteVisible && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>Select a circle and Zoom in or out the map to see the members location</Text>
        </View>
      )}


      {/* Map View */}
      <MapView
        ref={mapRef} // Reference for controlling the map
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        region={region && region.latitude && region.longitude ? region : undefined}
        showsUserLocation={true}
      >
        {currentLocation && !selectedCircle && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#FF8852"
          />
        )}
        {customMarker && !selectedCircle && (
          <Marker
            coordinate={{
              latitude: customMarker.latitude,
              longitude: customMarker.longitude,
            }}
            title={customMarker.name}
            pinColor="blue"
          />
        )}
        {contacts.map((contact) =>
          contact.location &&
          contact.location.latitude !== undefined &&
          contact.location.longitude !== undefined && (
            <Marker
              key={contact._id}
              coordinate={{
                latitude: contact.location.latitude,
                longitude: contact.location.longitude,
              }}
              title={contact.name}
              description={`Battery: ${contact.batteryPercentage}%`}
            >
              <View style={styles.customMarker}>
                <Image
                  source={{ uri: contact.profileImage }}
                  style={styles.markerImage}
                />
                <Text style={styles.markerText}>{contact.name}</Text>
              </View>
            </Marker>
          )
        )}

      </MapView>


      {/* Layer Buttons */}
      <View style={styles.layerButtons}>
        <TouchableOpacity style={styles.layerButton} onPress={toggleMapType}>
          <Icon name="layers" size={30} color="#FF8852" />
        </TouchableOpacity>
        {/* Share Location Button */}
        <TouchableOpacity style={styles.layerButton} onPress={handleShareLocation}>
          <Icon name="share" size={30} color="#FF8852" />
        </TouchableOpacity>
        {/* Weather Button */}
        <TouchableOpacity style={styles.layerButton} onPress={() => router.push("/screens/weatherScreen")} >
          <Icon name="cloud" size={30} color="#FF8852" />
        </TouchableOpacity>
      </View>


      {/* SOS and Create Your Zone Buttons */}
      <View style={styles.actionButtonsContainer}>

        <TouchableOpacity
          style={styles.activeSosButton}
          onPress={handleActiveSosPress}
        >
          <Text style={styles.activeSosButtonText}>Acknowledge SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => setSosModalVisible(true)}
        >
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.activeSosButton}
          onPress={() => router.push("/screens/NearbyServices2")}
        >
          <Text style={styles.activeSosButtonText}>Nearby Services</Text>
        </TouchableOpacity>


      </View>

      {/* Circle Details Modal */}
      <CircleDetailsModal
        visible={isCircleDetailsModalVisible}
        onClose={() => setCircleDetailsModalVisible(false)}
        circle={circleDetails}
        circleId={circleDetails?._id}
        circleCode={circleDetails?.circleCode}
      />

      {/* SOS Modal */}
      <Modal
        visible={isSosModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSosModalVisible(false)}
      >
        <SosScreen
          onPressClose={() => setSosModalVisible(false)}
          onPressInfo={() => console.log("Info pressed")}
          onPressAddMember={() => console.log("Add Member pressed")}
          selectedCircle={selectedCircle}
          selectedCircleId={selectedCircle?._id}
          onShowContactBottomSheet={handleShowContactBottomSheet}
        />
      </Modal>

      {/* Contact Bottom Sheet */}
      {loadingContacts ? (
        <ActivityIndicator size="large" color="#FF8852" />
      ) : (
        <ContactBottomSheet
          visible={isSheetVisible}
          onClose={() => setSheetVisible(false)}
          contacts={contacts}
          currentUserId={auth.currentUser ? auth.currentUser.uid : null}
          selectedCircleId={selectedCircle?._id}
        />

      )}

      {/* Bottom Menu */}
      <View style={styles.bottomMenu}>
        {/* Home */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/screens/home")}
        >
          <Icon name="home" size={25} color="#FF8852" />
          <Text style={styles.menuItemText}>Home</Text>
        </TouchableOpacity>

        {/* Your SOS */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/screens/userSos")}
        >
          <Icon name="emergency" size={25} color="#FF8852" />
          <Text style={styles.menuItemText}>Your SOS</Text>
        </TouchableOpacity>

        {/* Floating Chat Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleChatbotPress}
        >
          <LottieView
            source={require('../assets/animations/chatbot.json')} // Path to your animation
            autoPlay
            loop
            style={{ width: 130, height: 130 }} // Increase these values as needed
          />
        </TouchableOpacity>


        {/* Card */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/screens/CardScreen")}
        >
          <Icon name="credit-card" size={30} color="#FF8852" />
          <Text style={styles.menuItemText}>Card</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="group" size={30} color="#FF8852" />
          <Text style={styles.menuItemText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <ProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onProfileImageUpdate={handleProfileImageUpdate}
      />

      {/* SOS Details Modal */}
      <SOSDetailsModal
        isVisible={isSosDetailsModalVisible} // Ensure it's controlled by the state
        onClose={() => setSosDetailsModalVisible(false)}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noteContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  noteText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  map: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  topToolbar: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    margin: 10,
    zIndex: 10,
  },
  customMarker: {
    backgroundColor: '#FF8852',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
    alignItems: 'center',
    width: 80,
    height: 100,
  },
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#007BFF',
    marginBottom: 5,
  },
  markerText: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  iconContainer: {
    backgroundColor: "#fff",
    padding: 12,
    margin: 5,
    borderRadius: 50,
    elevation: 3,
  },
  layerButtons: {
    position: "absolute",
    bottom: 200,
    right: 15,
    flexDirection: "column",
  },
  layerButton: {
    padding: 10,
    borderRadius: 50,
    marginBottom: 15,
    elevation: 5,
    backgroundColor: "#FFF",
    height: 50,
    width: 50,
  },
  actionButtonsContainer: {
    position: "absolute",
    bottom: 100,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sosButton: {
    backgroundColor: "#FF8852",
    borderRadius: 50,
    padding: 15,
    elevation: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  sosButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  activeSosButton: {
    backgroundColor: "#FF8852",
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    flex: 1,
  },
  activeSosButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomMenu: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between", // Ensures equal spacing between items
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    elevation: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    flex: 1, // Ensures even spacing for each menu item
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 10,
    color: "#FF8852",
  },
  spacer: {
    flex: 0.6, // Adds space around the floating button
  },
  floatingButtonContainer: {
    bottom: 20, // Adjusts the floating button position
    alignSelf: "center", // Centers the button horizontally
    zIndex: 10,
  },
  floatingButton: {
    width: 80,
    height: 60,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#edebe8",
    bottom: 25,
  },
});

export default HomeScreen;
