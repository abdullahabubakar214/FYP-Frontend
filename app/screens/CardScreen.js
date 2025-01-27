import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Alert, TouchableOpacity, BackHandler } from 'react-native';
import { getUserCardData, deleteQRCode } from '../services/circleServices';
import { router } from 'expo-router';
import { getCurrentUserId } from '../firebase/firebaseauth';
import { Ionicons } from "@expo/vector-icons";
import EditCardModal from './EditCardModal';
import LockScreenModal from './SetOnLockScreen';

const MainCardScreen = () => {
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [lockScreenModalVisible, setLockScreenModalVisible] = useState(false);
  const [editedData, setEditedData] = useState({});

  const fetchCardData = async () => {
    try {
      const userId = getCurrentUserId();
      const response = await getUserCardData(userId);
      if (response.success) {
        setCardData(response.data);
        setEditedData(response.data.qrCodeDetails);
      } else {
        setCardData(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch card details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, []);

  useEffect(() => {
    const backAction = () => {
      router.push('/screens/home');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleDelete = async () => {
    const response = await deleteQRCode();
    if (response.success) {
      Alert.alert('Success', 'Card deleted successfully');
      setCardData(null);
    } else {
      Alert.alert('Error', response.message);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchCardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8852" />
      </View>
    );
  }

  if (!cardData) {
    return (
      <View style={styles.container}>
        <Image source={require("../assets/images/download.jpeg")} style={styles.image} />
        <Text style={styles.heading1}>Prepared in case of emergency</Text>
        <Text style={styles.description}>Thanks to the emergency card and EAS, rescue services can access crucial medical information on the spot.</Text>
        <TouchableOpacity onPress={() => router.push("/screens/createCard")} style={styles.createCardButton}>
          <Text style={styles.buttonText}>Emergency Card setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    
    <View style={styles.header}>
    <Text style={styles.headerTitle}>Emergency Card</Text>
    <TouchableOpacity onPress={() => router.push("/screens/home")} style={styles.closeButton}>
      <Text style={styles.closeText}> X </Text>
    </TouchableOpacity>
  </View>
    <ScrollView contentContainerStyle={styles.scrollViewContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Personal Details</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#FF8852" />
        </TouchableOpacity>
        <Text style={styles.label}>Full Name: {cardData.qrCodeDetails.fullName || "N/A"}</Text>
        <Text style={styles.label}>Age: {cardData.qrCodeDetails.age || "N/A"}</Text>
        <Text style={styles.label}>Blood Group: {cardData.qrCodeDetails.bloodGroup || "N/A"}</Text>
        <Text style={styles.label}>
          Medicines: {Array.isArray(cardData.qrCodeDetails.medicines) ? cardData.qrCodeDetails.medicines.join(", ") : "N/A"}
        </Text>
        <Text style={styles.label}>
          Diseases: {Array.isArray(cardData.qrCodeDetails.disease) ? cardData.qrCodeDetails.disease.join(", ") : "N/A"}
        </Text>
        <Text style={styles.label}>Address: {cardData.qrCodeDetails.address || "N/A"}</Text>
        <Text style={styles.label}>
          Allergies: {Array.isArray(cardData.qrCodeDetails.allergies) ? cardData.qrCodeDetails.allergies.join(", ") : "N/A"}
        </Text>
        <Text style={styles.label}>Emergency Instructions: {cardData.qrCodeDetails.emergencyInstructions || "N/A"}</Text>
        
        <Text style={styles.subtitle}>Emergency Contact</Text>
        <Text style={styles.label}>Emergency Number 1: {cardData.qrCodeDetails.emergencyNumbers ? cardData.qrCodeDetails.emergencyNumbers[0] : "N/A"}</Text>
        <Text style={styles.label}>Emergency Number 2: {cardData.qrCodeDetails.emergencyNumbers ? cardData.qrCodeDetails.emergencyNumbers[1] : "N/A"}</Text>

        {cardData.qrCodeImage ? (
          <>
            <Image style={styles.qrCodeImage} source={{ uri: cardData.qrCodeImage }} />
            <TouchableOpacity style={styles.addToLockScreenButton} onPress={() => setLockScreenModalVisible(true)}>
              <Text style={styles.buttonText}>Add to Lock Screen</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.label}>No QR Code available</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
          <Text style={styles.buttonText}>Edit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete Card</Text>
        </TouchableOpacity>
      </View>

      <EditCardModal
        visible={editModalVisible}
        editedData={editedData}
        setEditedData={(newData) => {
          setEditedData(newData); 
          setCardData((prev) => ({
            ...prev,
            qrCodeDetails: newData, // Update cardData to reflect the changes
          }));
        }}
        onClose={() => setEditModalVisible(false)}
      />

      <LockScreenModal
        visible={lockScreenModalVisible}
        onClose={() => setLockScreenModalVisible(false)}
        qrCodeImage={cardData.qrCodeImage}
      />
    </ScrollView>
    </>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: 150, height: 150, marginBottom: 20 },
  heading1: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  createCardButton: { backgroundColor: '#FF8852', padding: 15, borderRadius: 10 },
  buttonText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#FF8852', marginTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  closeButton: { padding: 5 },
  closeText: { color: '#FFF', fontSize: 18 },
  refreshButton: { position: 'absolute', right: 20, top: 10 },
  scrollViewContainer: { paddingBottom: 20, paddingHorizontal: 10 },
  card: { padding: 20, borderRadius: 10, marginVertical: 10 },
  subtitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  label: { fontSize: 16, marginVertical: 2 },
  qrCodeImage: { width: 150, height: 150, alignSelf: 'center', marginVertical: 10 },
  addToLockScreenButton: { backgroundColor: '#FF8852', padding: 10, borderRadius: 10, alignSelf: 'center', marginTop: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  editButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, flex: 1, marginRight: 10 },
  deleteButton: { backgroundColor: '#F44336', padding: 15, borderRadius: 10, flex: 1, marginLeft: 10 }
});

export default MainCardScreen;
