import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Button,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchJoinedCircles,
  createCircle,
  joinCircle,
} from "../../services/circleServices";
import { fetchCreatedCircles } from "../../services/circleServices"; // Adjust the path based on your folder structure
import * as ImagePicker from "expo-image-picker";

const CircleDropdown = ({ onSelectCircle }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedCircleName, setSelectedCircleName] = useState("Select Circle");
  const [circles, setCircles] = useState({ created: [], joined: [] });
  const [loading, setLoading] = useState(false);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setJoinModalVisible] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [circleCode, setCircleCode] = useState("");
  const [modalLoading, setModalLoading] = useState(false); // For loading during create/join operations

  // Image picker function
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.uri); // Save the selected image URI
    }
  };

  // Fetch circles
  const loadCircles = async () => {
    setLoading(true);
    try {
      const createdCirclesResponse = await fetchCreatedCircles();
      const joinedCirclesResponse = await fetchJoinedCircles();

      if (!createdCirclesResponse.success) {
        console.log(
          createdCirclesResponse.message || "No circles created by this user."
        );
      }

      if (!joinedCirclesResponse.success) {
        console.log(
          joinedCirclesResponse.message || "No circles joined by this user."
        );
      }

      const createdCircles = createdCirclesResponse.data || [];
      const joinedCircles = joinedCirclesResponse.data || [];

      const filteredJoinedCircles = joinedCircles.filter(
        (joinedCircle) =>
          !createdCircles.some(
            (createdCircle) => createdCircle._id === joinedCircle._id
          )
      );

      setCircles({
        created: createdCircles,
        joined: filteredJoinedCircles,
      });
    } catch (error) {
      console.error("Failed to load circles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCircles(); // Load circles when the component mounts
  }, []);

  const handleCirclePress = async (circle) => {
    setSelectedCircleName(circle.name);
    await onSelectCircle(circle); // Fetch contacts in Home after selecting a circle
    setDropdownVisible(false);
  };

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      alert("Circle name is required");
      return;
    }

    setModalLoading(true);
    try {
      const response = await createCircle({ name: circleName, profileImage });
      if (response.success) {
        setCreateModalVisible(false);
        setCircleName("");
        setProfileImage("");
        loadCircles(); // Refresh the circles after creation
      } else {
        alert(response.message); // Display error message
      }
    } catch (error) {
      console.error("Error creating circle:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!circleCode.trim()) {
      alert("Circle code is required");
      return;
    }

    setModalLoading(true);
    try {
      await joinCircle(circleCode); // Pass circleCode directly
      setJoinModalVisible(false);
      setCircleCode("");
      loadCircles(); // Refresh the circles after joining
    } catch (error) {
      console.error("Error joining circle:", error);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dropdown for Circle Selection */}
      <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
        <Text style={styles.dropdownButtonText}>{selectedCircleName}</Text>
        <Ionicons
          name={isDropdownVisible ? "chevron-up" : "chevron-down"}
          size={22}
          color="#FF8852"
          marginLeft={20}
        />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="small" color="#FF8852" />
      ) : (
        isDropdownVisible && (
          <View style={styles.fullDropdown}>
            <ScrollView>
              {/* Top Actions: Create Circle, Join Circle, Refresh */}
              <View style={styles.topActions}>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Text style={styles.actionText}>Create Circle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => setJoinModalVisible(true)}
                >
                  <Text style={styles.actionText}>Join Circle</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={loadCircles}>
                  <Ionicons
                    name="refresh"
                    size={24}
                    color="#FF8852"
                    marginLeft={10}
                  />
                </TouchableOpacity>
              </View>

              {/* Created Circles Section */}
              <Text style={styles.sectionTitle}>Created Circles</Text>
              {circles.created.length === 0 ? (
                <Text style={styles.emptyMessage}>No circles created yet.</Text>
              ) : (
                circles.created.map((circle) => (
                  <TouchableOpacity
                    key={circle._id}
                    style={styles.dropdownItem}
                    onPress={() => handleCirclePress(circle)}
                  >
                    <View style={styles.circleItem}>
                      <Text style={styles.dropdownItemText}>{circle.name}</Text>
                      {selectedCircleName === circle.name && (
                        <Ionicons
                          name="checkmark"
                          size={24}
                          color="#FF8852"
                          marginLeft={200}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {/* Joined Circles Section */}
              <Text style={styles.sectionTitle}>Joined Circles</Text>
              {circles.joined.length === 0 ? (
                <Text style={styles.emptyMessage}>
                  You have not joined any circles yet.
                </Text>
              ) : (
                circles.joined.map((circle) => (
                  <TouchableOpacity
                    key={circle._id}
                    style={styles.dropdownItem}
                    onPress={() => handleCirclePress(circle)}
                  >
                    <View style={styles.circleItem}>
                      <Text style={styles.dropdownItemText}>{circle.name}</Text>
                      {selectedCircleName === circle.name && (
                        <Ionicons
                          name="checkmark"
                          size={24}
                          color="#FF8852"
                          marginLeft={200}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )
      )}

      {/* Create Circle Modal */}
      <Modal visible={isCreateModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Circle</Text>
          <TextInput
            style={styles.input}
            placeholder="Circle Name"
            value={circleName}
            onChangeText={setCircleName}
          />
          {modalLoading ? (
            <ActivityIndicator size="small" color="#FF8852" />
          ) : (
            <TouchableOpacity
              onPress={handleCreateCircle}
              style={styles.createCircleButton}
            >
              <Text style={styles.buttonText}>Create Circle</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setCreateModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Join Circle Modal */}
      <Modal visible={isJoinModalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Join Circle</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-Character Circle Code"
            value={circleCode}
            onChangeText={setCircleCode}
          />
          {modalLoading ? (
            <ActivityIndicator size="small" color="#FF8852" />
          ) : (
            <TouchableOpacity
              onPress={handleJoinCircle}
              style={styles.createCircleButton}
            >
              <Text style={styles.buttonText}>Join Circle</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setJoinModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { zIndex: 10 },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 45,
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderRadius: 50,
    borderColor: "#fff",
    borderWidth: 1,
  },
  dropdownButtonText: {
    color: "#FF8852",
    fontWeight: "bold",
  },
  fullDropdown: {
    position: "absolute",
    top: 50,
    left: -100,
    right: -100,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",

    margin: 20,
  },
  createButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FF8852",
    borderRadius: 20,
    marginRight: 10,
  },
  joinButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FF8852",
    borderRadius: 20,
    marginLeft: 10,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },

  sectionTitle: {
    fontWeight: "bold",
    marginVertical: 10,
    marginHorizontal: 20,
    color: "#FF8852",
  },
  emptyMessage: {
    marginLeft: 10,
  },
  // dropdownItem: {
  //   // padding: 20,

  //   // borderBottomColor: "#ccc",
  //   // borderBottomWidth: 1,
  // },
  dropdownItemText: {
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    height: "50%",
    justifyContent: "center",
    padding: 20,
    justifyContent: "flex-top",

    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 60,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FF8852",
    paddingLeft: 20,
    paddingVertical: 9,
    marginVertical: 10,
    borderRadius: 50,
  },
  imagePicker: {
    alignItems: "center",
    marginVertical: 10,

    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#FF8852",
    borderRadius: 50,
  },
  imagePickerText: {
    color: "#FF8852",
  },
  createCircleButton: {
    backgroundColor: "#FF8852",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: "#FF8852",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff", // White text
    fontWeight: "bold",
    fontSize: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  circleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  circleImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
});

export default CircleDropdown;
