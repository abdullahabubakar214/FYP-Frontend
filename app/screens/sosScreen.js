import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Linking,
  Vibration,
  Animated,
  BackHandler,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Battery from "expo-battery";
import * as Location from "expo-location";
import { sendSOS } from "../services/circleServices"; // Import the sendSOS function
import { Picker } from "@react-native-picker/picker";
import SosDetailsModal from "./sosDetailsModal";

const SosScreen = ({
  onPressClose,
  onPressInfo,
  onPressAddMember,
  selectedCircle,
  selectedCircleId,
  onShowContactBottomSheet,
}) => {
  const [emergencyType, setEmergencyType] = useState("General"); // Default value
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [batteryStatus, setBatteryStatus] = useState(0);
  const [sendToAll, setSendToAll] = useState(false);
  const [sosMessage, setSosMessage] = useState(`It's an Emergency! Help needed! An SOS help is initiated in ${selectedCircle?.name || "the selected circle"}`);
  const [isSosModalVisible, setSosModalVisible] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [cancelAnim] = useState(new Animated.Value(1)); // Animation value for the cancel button
  const [isSosSent, setSosSent] = useState(false); // New state for tracking SOS sent status
  const [customEmergency, setCustomEmergency] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const emergencyTypes = [
    "Fire", 
    "Medical", 
    "Police", 
    "Disaster Emergency", 
    "Accidental Emergency", 
    "Theft Emergency",
    "Gas Leak Emergency", 
    "Vehicular Breakdown",
    "Flood Emergency", 
    "Public Health Emergency", 
    "Severe Weather Alert", 
    "General", 
];


  const [userLocation, setUserLocation] = useState({
    lat: null,
    lng: null,
    address: "",
  });

  useEffect(() => {
    const fetchBatteryStatus = async () => {
      const batteryInfo = await Battery.getBatteryLevelAsync();
      setBatteryStatus(Math.round(batteryInfo * 100));
    };

    // Fetch location and use reverse geocoding API
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        setUserLocation({ lat: latitude, lng: longitude, address: "Fetching address..." });

        // Fetch address from geocode.maps.co
        try {
          const response = await fetch(
            `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=671be423c3cde679070422nrv79416b`
          );
          const data = await response.json();
          if (data) {
            const displayName = data.display_name || "Unknown location";
            const formattedAddress = `${displayName}`;
            setUserLocation((prev) => ({ ...prev, address: formattedAddress }));
          } else {
            setUserLocation((prev) => ({ ...prev, address: "Address not found" }));
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          setUserLocation((prev) => ({ ...prev, address: "Error fetching address" }));
        }
      }
    };


    fetchBatteryStatus();
    fetchLocation();
  }, []);

  useEffect(() => {
    if (isCountdownActive && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isCountdownActive && countdown === 0 && !isSosSent) {
      handleSendSos(); // Send SOS when the timer reaches 0
    }
  }, [countdown, isCountdownActive, isSosSent]);

  useEffect(() => {
    const backAction = () => {
      handleCancel(); // Call handleCancel when back button is pressed
      return true; // Prevent default behavior (going back)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // Cleanup the listener on unmount
  }, []);

  // const handleOpenModal = () => {
  //   setSosModalVisible(true);
  // };

  const constructMessage = () => {
    return `${sosMessage}\nType: ${emergencyType}\nLocation: ${userLocation.address || `${userLocation.lat}, ${userLocation.lng}`
      }\nBattery Status: ${batteryStatus}%`;
  };

  const handleMessageModalOpen = () => {
    setShowMessageModal(true);
  };

  const handleMessageModalClose = () => {
    setShowMessageModal(false);
  };

  const toggleSendToAll = () => {
    setSendToAll((prev) => !prev);
  };

  const openLocation = () => {
    const locationUrl = `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=671be423c3cde679070422nrv79416b`;
    Linking.openURL(locationUrl);
  };

  const handleCloseModal = () => {
    setSosModalVisible(false);
  };

  const startCountdown = () => {
    if (
      !sosMessage ||
      !userLocation.address ||
      !selectedCircle ||
      !emergencyType
    ) {
      Alert.alert("Error", "Please complete all fields before starting SOS.");
      return;
    }
    setCountdown(10);
    setIsCountdownActive(true);
    setSosSent(false); // Reset sosSent flag when starting a new countdown
  };

  const handleSendSos = async () => {
    if (isSosSent) return; // Prevent multiple SOS sends
    setSosSent(true);

    Vibration.vibrate();

    const sosData = {
      message: sosMessage,
      emergencyType,
      userLocation: { address: userLocation.address },
      selectedCircleIds: sendToAll ? [] : [selectedCircle],
      batteryStatus,
      sendToAllCircles: sendToAll,
    };

    try {
      const result = await sendSOS(sosData);
      if (result.success) {
      //  Alert.alert("Success", "SOS sent successfully!");

        setIsCountdownActive(false);
        setCountdown(10);

        // Show the details modal
        setSosModalVisible(true);
      } else {
        Alert.alert("Error", "Failed to send SOS: " + result.message);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while sending SOS");
    }
  };


  const handleCancel = () => {
    Alert.alert(
      "SOS Cancelled",
      "You have cancelled the SOS."
      // ,[{ text: "OK", onPress: onPressClose },] // Close the modal after alert
    );
    setIsCountdownActive(false);
    setCountdown(10);
    setSosSent(false); // Reset SOS sent status when cancelling
  };
  // Animate the cancel button when pressed
  const animateCancelButton = () => {
    Animated.sequence([
      Animated.timing(cancelAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(cancelAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(handleCancel);
  };

  // Filter emergency types based on search query
  const filteredEmergencyTypes = emergencyTypes.filter(type =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // // Handle adding a custom emergency
  // const handleCustomEmergencyAdd = () => {
  //   if (customEmergency && !emergencyTypes.includes(customEmergency)) {
  //     setEmergencyType(customEmergency);
  //   }
  // };


  return (

    <View style={styles.container}>
      <View style={styles.notebox}>
    <Text style={styles.noteboxText}>
      Please ensure your emergency details are correct before proceeding. Tap on Show SOS Message to edit the SOS Message
    </Text>
  </View>
      {/* Parameters Row */}
      <View style={styles.parametersRow}>
        <View style={styles.pickerContainer}>
          {/* <TextInput
            placeholder="Search Type Here"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          /> */}
          <Picker
            selectedValue={emergencyType}
            style={styles.picker}
            onValueChange={(itemValue) => {
              // if (itemValue === "Custom") {
              //   handleCustomEmergencyAdd();
              // } else {
                setEmergencyType(itemValue);
              // }
            }}
          >
            {filteredEmergencyTypes.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
          {/* {emergencyType === "Custom" && (
            <TextInput
              placeholder="Enter custom emergency"
              value={customEmergency}
              onChangeText={setCustomEmergency}
              onSubmitEditing={handleCustomEmergencyAdd}
              style={styles.customInput}
            />
          )} */}
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Send to All</Text>
          <TouchableOpacity style={styles.toggleButton} onPress={toggleSendToAll}>
            <Text style={styles.toggleButtonText}>{sendToAll ? "ON" : "OFF"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.circleName}
        onPress={onShowContactBottomSheet}
      >
        <Text style={styles.textcircle}>Selected Circle: </Text>
        <Text
          style={styles.textcircleName}
          onPress={() => {
            if (sendToAll) {
              Alert.alert("Notification", "All circles will be notified.");
            } else {
              onShowContactBottomSheet();
            }
          }}
        >
          {sendToAll
            ? "All circles will be notified."
            : selectedCircle?.name || "No circle selected"}
        </Text>
      </TouchableOpacity>


      <Text style={styles.locationText}>
        <Text style={styles.currentlocationText}>Current Location: </Text>
        {userLocation.address || `${userLocation.lat}, ${userLocation.lng}`}
      </Text>

      <TouchableOpacity style={styles.sosButton} onPress={startCountdown}>
        <Text style={styles.sosText}>{isCountdownActive ? `Sending in ${countdown}s` : "Tap to send SOS"}</Text>
      </TouchableOpacity>

      {isCountdownActive && (
        <TouchableOpacity onPress={animateCancelButton} style={styles.cancelButton}>
          <Animated.View style={[styles.cancelButtonInner, { transform: [{ scale: cancelAnim }] }]}>
            <Text style={styles.cancelButtonText}>Cancel SOS</Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.messageIcon} onPress={handleMessageModalOpen}>
        <Ionicons name="chatbubble-outline" size={28} color="#FF8852" />
        <Text style={styles.messageText}>Show SOS Message</Text>
      </TouchableOpacity>

      <Modal visible={showMessageModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit SOS Message</Text>
            <TextInput
              style={styles.sosInput}
              value={sosMessage}
              onChangeText={setSosMessage}
              multiline
              numberOfLines={4}
              placeholder="Type your message here..."
              placeholderTextColor="#aaa"
            />
            <Text style={styles.locationText}>
              Location: <Text style={styles.linkText} onPress={openLocation}>{userLocation.address || "Unknown"}</Text>
            </Text>
            <Text style={styles.modalMessage}>{constructMessage()}</Text>
            <TouchableOpacity onPress={handleMessageModalClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SOS Modal */}
      <Modal
        transparent={true}
        visible={isSosModalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        {/* Add any additional modal content here */}
      </Modal>
      <TouchableOpacity style={styles.closeButton} onPress={onPressClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>

      <SosDetailsModal
        isVisible={isSosModalVisible}
        onClose={handleCloseModal}
        sosDetails={{
          message: sosMessage,
          circle: selectedCircle?.name || "No circle selected",
          location: userLocation.address || "Location not available",
          emergencyType: emergencyType || "General",
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
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
  
  header: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
  },
  parametersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginVertical: 10,
    padding: 20,
  },
  pickerContainer: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "40%",
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleButton: {
    padding: 10,
    backgroundColor: "#FF8852",
    borderRadius: 20,
  },
  toggleButtonText: {
    color: "#fff",
  },
  circleName: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  textcircleName: {
    fontWeight: "bold",
    fontSize: 20,
    color: '#FF8852',
  },
  textcircle: {
    fontSize: 16,
  },
  locationText: {
    color: "#FF8852",
    marginBottom: 10,
    fontSize: 16,


    marginTop: 20,
  },
  currentlocationText: {
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  sosButton: {
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
    width: 250,
    height: 250,
    backgroundColor: "#FF8852",
    borderRadius: 125,
    borderColor: "#FFAD6C",
    borderWidth: 17,
    elevation: 5,
  },
  sosText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  cancelButtonInner: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  cancelButton: {
    width: 200,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF8852",
    borderRadius: 25,
    marginVertical: 20,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  messageIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
  },
  messageText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF8852",
    marginBottom: 10,
  },
  sosInput: {
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  linkText: {
    textDecorationLine: "underline",
    color: "#FF8852",
  },
  modalMessage: {
    marginBottom: 10,
    fontSize: 14,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#FF8852",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#FF8852",
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
    marginTop: 20,
    width: 300,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default SosScreen;
