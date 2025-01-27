import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { createOrUpdateQRCode } from "../services/circleServices";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CreateCardScreen = ({ onPressClose }) => {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicines, setMedicines] = useState("");
  const [disease, setDisease] = useState("");
  const [emergencyNumber1, setEmergencyNumber1] = useState("");
  const [emergencyNumber2, setEmergencyNumber2] = useState("");
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyInstructions, setEmergencyInstructions] = useState("");
  const router = useRouter();

  const handleCreateCard = async () => {
    if (!fullName || !age || !bloodGroup || !emergencyNumber1) {
      Alert.alert("Error", "Please fill out all required fields.");
      return;
    }

    const userData = {
      fullName,
      age,
      bloodGroup,
      medicines: medicines.split(",").map((item) => item.trim()),
      disease: disease.split(",").map((item) => item.trim()),
      emergencyNumber1,
      emergencyNumber2,
      address,
      allergies: allergies.split(",").map((item) => item.trim()),
      emergencyInstructions,
    };

    try {
      const response = await createOrUpdateQRCode(userData);
      if (response.success) {
        Alert.alert("Success", "Card created successfully!");
        router.push("/screens/CardScreen");
      } else {
        Alert.alert("Error", response.message || "Failed to create card");
      }
    } catch (error) {
      console.error("Error creating card:", error);
      Alert.alert("Error", "An error occurred while creating the card.");
    }


  };

  return (
    <>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => router.push("/screens/CardScreen")} style={styles.closeButton}>
      <Text style={styles.closeText}> X </Text>
    </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Card</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Personal Emergency Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Blood Group"
          value={bloodGroup}
          onChangeText={setBloodGroup}
        />
        <TextInput
          style={styles.input}
          placeholder="Medicines (comma-separated)"
          value={medicines}
          onChangeText={setMedicines}
        />
        <TextInput
          style={styles.input}
          placeholder="Diseases (comma-separated)"
          value={disease}
          onChangeText={setDisease}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
        />
        <TextInput
          style={styles.input}
          placeholder="Allergies (comma-separated)"
          value={allergies}
          onChangeText={setAllergies}
        />
        <TextInput
          style={styles.input}
          placeholder="Emergency Instructions"
          value={emergencyInstructions}
          onChangeText={setEmergencyInstructions}
        />
        <Text style={styles.title}>Emergency Contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Emergency Number 1"
          value={emergencyNumber1}
          onChangeText={setEmergencyNumber1}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Emergency Number 2 (optional)"
          value={emergencyNumber2}
          onChangeText={setEmergencyNumber2}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          onPress={handleCreateCard}
          style={styles.createCardButton}
        >
          <Text style={styles.buttonText}>Emergency Card setup</Text>
        </TouchableOpacity>
      </ScrollView>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical:30,
    // marginTop: 10,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  closeButton: { padding: 5 },
  closeText: { color: '#FFF', fontSize: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#FF8852",
    // borderRadius: 10,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 25,
    alignItems:"center",
    fontWeight: "bold",
    marginRight: 65,
    color: '#fff',
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 1, // Adds a subtle shadow effect
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  createCardButton: {
    backgroundColor: "#FF8852",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CreateCardScreen;
