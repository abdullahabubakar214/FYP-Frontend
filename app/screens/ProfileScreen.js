import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseauth';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task outside the component
TaskManager.defineTask(LOCATION_TASK_NAME, async () => {
  try {
    const location = await Location.getCurrentPositionAsync({});
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const auth = getAuth();
    const uid = auth.currentUser?.uid;

    if (uid && location) {
      await updateDoc(doc(db, 'users', uid), {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        batteryLevel: Math.round(batteryLevel * 100),
      });
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Error updating background location:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background task function
export const registerBackgroundTask  = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isRegistered) {
      await Location.requestBackgroundPermissionsAsync();
      await BackgroundFetch.registerTaskAsync(LOCATION_TASK_NAME, {
        minimumInterval: 15 * 60, // every 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (error) {
    console.error("Error registering background task:", error);
  }
};

const ProfileModal = ({ visible, onClose, onProfileImageUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editableField, setEditableField] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedPhoneNumber, setUpdatedPhoneNumber] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationText, setLocationText] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [saving, setSaving] = useState(false); // Loader state

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    registerBackgroundTask();
  }, []);

  const fetchLocationText = async (lat, lon) => {
    try {
      const response = await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&api_key=671be423c3cde679070422nrv79416b`); // Corrected `long` to `lon`
      
      // Check if the response is ok
      if (!response.ok) {
        const textResponse = await response.text();
        console.error('Error fetching location text:', textResponse);
        throw new Error('Network response was not ok');
      }
  
      const textResponse = await response.text(); // Get the response as text first
      console.log('Raw response:', textResponse); // Log the raw response
  
      const data = JSON.parse(textResponse); // Try parsing the text response to JSON
      const addressComponents = data?.address;
      const address = addressComponents
        ? `${addressComponents.amenity || ""} ${addressComponents.road || ""} ${addressComponents.village || ""} ${addressComponents.state || ""} ${addressComponents.country || ""}`
          .replace(/, ,/g, ',')
          .trim()
        : "Location not found";
      setLocationText(address);
    } catch (error) {
      console.log('Error fetching location text:', error);
      setLocationText("Location not found");
    }
  }; 

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser(userData);
        setUpdatedName(userData.fullName || '');
        setUpdatedPhoneNumber(userData.phoneNumber || '');
        if (userData.profileImage) {
          setNewProfileImage(userData.profileImage);
          onProfileImageUpdate(userData.profileImage);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  const handleRefresh = () => {
    fetchUserData();
  };

  useEffect(() => {
    const fetchLocationAndBattery = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
        fetchLocationText(location.coords.latitude, location.coords.longitude);
        await updateLocationAndBattery(location.coords.latitude, location.coords.longitude);
      }
      const batteryInfo = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(batteryInfo * 100));
      await updateLocationAndBattery(latitude, longitude, batteryLevel);
    };

    const updateLocationAndBattery = async (lat, lon, battery) => {
      if (uid) {
        try {
          await updateDoc(doc(db, 'users', uid), {
            latitude: lat,
            longitude: lon,
            batteryLevel: battery || batteryLevel, // Use the latest battery level
          });
        } catch (error) {
          console.error('Error updating location and battery status:', error);
        }
      }
    };

    fetchLocationAndBattery();
    const intervalId = setInterval(fetchLocationAndBattery, 60000);
    return () => clearInterval(intervalId);
  }, [uid, latitude, longitude, batteryLevel]);

  const handleEdit = (field) => setEditableField(field);

  const handleSaveChanges = async () => {
    if (!uid) return;
    setSaving(true); // Start loader
    try {
      const updatedData = { fullName: updatedName, phoneNumber: updatedPhoneNumber };
      if (newProfileImage) {
        const profileImageUrl = await uploadProfileImage(newProfileImage);
        updatedData.profileImage = profileImageUrl;
        onProfileImageUpdate(profileImageUrl);
      }
      await updateDoc(doc(db, 'users', uid), updatedData);
      Alert.alert('Success', 'Profile updated successfully');
      setUser({ ...user, ...updatedData });
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false); // Stop loader
    }
  };

  const uploadProfileImage = async (uri) => {
    const storage = getStorage();
    const imageRef = ref(storage, `profileImages/${uid}.jpg`);
    const response = await fetch(uri);
    const blob = await response.blob();
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) setNewProfileImage(result.assets[0].uri);
  };

  if (loading) return <ActivityIndicator size="large" color="#FF8852" />;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-outline" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={28} color="#FF8852" />
          </TouchableOpacity>
          {loading ? (
            <ActivityIndicator size="large" color="#FF8852" />
          ) : (
            <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleImagePick} style={styles.imagePicker}>
                <Image source={{ uri: newProfileImage || user?.profileImage }} style={styles.profileImage} />
                <Ionicons name="camera-outline" size={28} color="#FF8852" style={styles.cameraIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Name</Text>
              {editableField === 'name' ? (
                <TextInput
                  style={styles.input}
                  value={updatedName}
                  onChangeText={setUpdatedName}
                  placeholder="Enter your name"
                />
              ) : (
                <Text style={styles.value}>{user?.fullName || 'N/A'}</Text>
              )}
              <TouchableOpacity onPress={() => handleEdit('name')}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number</Text>
              {editableField === 'phoneNumber' ? (
                <TextInput
                  style={styles.input}
                  value={updatedPhoneNumber}
                  onChangeText={setUpdatedPhoneNumber}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>{user?.phoneNumber || 'N/A'}</Text>
              )}
              <TouchableOpacity onPress={() => handleEdit('phoneNumber')}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'N/A'}</Text>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{locationText}</Text>
            </View>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Battery Level</Text>
              <View style={styles.batteryBarContainer}>
                <View style={[styles.batteryBar, { width: `${batteryLevel}%` }]} />
              </View>
              <Text style={styles.batteryText}>{batteryLevel}%</Text>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
           )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: '80%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  container: {
    paddingHorizontal: 20,
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePicker: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 5,
  },
  editButton: {
    color: '#FF8852',
    marginTop: 5,
  },
  batteryBarContainer: {
    height: 10,
    width: '100%',
    backgroundColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 5,
  },
  batteryBar: {
    height: '100%',
    backgroundColor: '#FF8852',
  },
  batteryText: {
    marginTop: 5,
  },
  saveButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FF8852',
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

// Ensure this is at the bottom of ProfileModal.js
export default ProfileModal;