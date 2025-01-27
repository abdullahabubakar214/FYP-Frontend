import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { createOrUpdateQRCode } from '../services/circleServices';
import { getCurrentUserId } from '../firebase/firebaseauth';

const EditCardModal = ({ visible, editedData, setEditedData, onClose }) => {
  const [localData, setLocalData] = useState({
    ...editedData,
    emergencyNumbers: editedData.emergencyNumbers || ["", ""],
  });

  useEffect(() => {
    setLocalData({
      ...editedData,
      emergencyNumbers: editedData.emergencyNumbers || ["", ""],
    });
  }, [editedData, visible]);

  const handleSave = async () => {
    try {
      const userId = getCurrentUserId();
      const response = await createOrUpdateQRCode({ ...localData, userId });

      if (response.success) {
        Alert.alert('Success', 'Card updated successfully');

        // Update `setEditedData` without overwriting other fields if unchanged
        setEditedData((prev) => ({
          ...prev,
          ...localData,
          emergencyNumbers: localData.emergencyNumbers || prev.emergencyNumbers,
        }));
        onClose();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update card details');
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "emergencyNumbers") {
      setLocalData((prevData) => ({
        ...prevData,
        emergencyNumbers: [
          value.index === 0 ? value.text : prevData.emergencyNumbers[0],
          value.index === 1 ? value.text : prevData.emergencyNumbers[1],
        ],
      }));
    } else {
      setLocalData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Card</Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={localData.fullName || ""}
            onChangeText={(text) => handleInputChange("fullName", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={localData.age || ""}
            onChangeText={(text) => handleInputChange("age", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Blood Group"
            value={localData.bloodGroup || ""}
            onChangeText={(text) => handleInputChange("bloodGroup", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Medicines (comma-separated)"
            value={localData.medicines ? localData.medicines.join(", ") : ""}
            onChangeText={(text) =>
              handleInputChange("medicines", text.split(",").map((item) => item.trim()))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Diseases (comma-separated)"
            value={localData.disease ? localData.disease.join(", ") : ""}
            onChangeText={(text) =>
              handleInputChange("disease", text.split(",").map((item) => item.trim()))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={localData.address || ""}
            onChangeText={(text) => handleInputChange("address", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Allergies (comma-separated)"
            value={localData.allergies ? localData.allergies.join(", ") : ""}
            onChangeText={(text) =>
              handleInputChange("allergies", text.split(",").map((item) => item.trim()))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Emergency Instructions"
            value={localData.emergencyInstructions || ""}
            onChangeText={(text) => handleInputChange("emergencyInstructions", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Emergency Number 1"
            value={localData.emergencyNumbers[0] || ""}
            onChangeText={(text) =>
              handleInputChange("emergencyNumbers", { index: 0, text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Emergency Number 2"
            value={localData.emergencyNumbers[1] || ""}
            onChangeText={(text) =>
              handleInputChange("emergencyNumbers", { index: 1, text })
            }
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FF8852' },
  closeText: { color: '#FFF', fontWeight: 'bold', marginRight: 'auto', fontSize: 18 },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  modalContent: { padding: 20 },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});

export default EditCardModal;
