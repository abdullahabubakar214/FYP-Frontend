import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Linking, Share } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const UserProfileScreen = ({ user, visible, onClose }) => {
  const [locationAddress, setLocationAddress] = useState("Fetching location...");
  const profileImageURI = user?.profileImage || 'https://example.com/default-image.jpg';
  const router = useRouter();

  useEffect(() => {
    const fetchLocationAddress = async () => {
      try {
        const response = await fetch(
          `https://geocode.maps.co/reverse?lat=${user.location.latitude}&lon=${user.location.longitude}&api_key=671be423c3cde679070422nrv79416b`
        );
        const data = await response.json();
        if (data && data.address) {
          const address = `${data.display_name || "Location not available"}`;
          setLocationAddress(address);
        } else {
          setLocationAddress("Location not found");
        }
      } catch (error) {
        console.error("Error fetching location address:", error);
        setLocationAddress("Error fetching location");
      }
    };

    if (user?.location?.latitude && user?.location?.longitude) {
      fetchLocationAddress();
    }
  }, [user.location.latitude, user.location.longitude]);

  const handleCall = () => {
    Linking.openURL(`tel:${user.phoneNumber}`);
  };

  const handleMessage = () => {
    Linking.openURL(`sms:${user.phoneNumber}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${user.phoneNumber}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${user.email}`);
  };

  const handleSeeOnMap = () => {
    const { latitude, longitude } = user.location;
    Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
  };

  const handleShare = async () => {
    try {
      const locationLink = `https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude}`;
      const message = `Contact Info:
Name: ${user.name}
Phone: ${user.phoneNumber}
Location: ${locationLink}`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error("Error sharing contact info:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: profileImageURI }}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>{user.name}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
              <MaterialIcons name="call" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={handleMessage}>
              <MaterialIcons name="message" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={handleWhatsApp}>
              <FontAwesome name="whatsapp" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.emailButton]} onPress={handleEmail}>
              <MaterialIcons name="email" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
              <MaterialIcons name="share" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.profileDetail}>
              <Text style={styles.boldText}>Phone:</Text> {user.phoneNumber}
            </Text>
            <Text style={styles.profileDetail}>
              <Text style={styles.boldText}>Email:</Text> {user.email}
            </Text>
            <Text style={styles.profileDetail}>
              <Text style={styles.boldText}>Role:</Text> {user.role || 'Unknown'}
            </Text>
            <Text style={styles.profileDetail}>
              <Text style={styles.boldText}>Battery:</Text> {user.batteryPercentage}%
            </Text>
            <Text style={styles.profileDetail}>
              <Text style={styles.boldText}>Longitude:</Text> {user.location.longitude}
            </Text>
            <Text style={styles.profileDetail}>
              <Text style={styles.boldText}>Latitude:</Text> {user.location.latitude}
            </Text>
            <Text style={styles.profileDetail}>
              <Text style={styles.boldText}>Location:</Text> {locationAddress}
            </Text>
          </View>
          <TouchableOpacity style={styles.mapButton} onPress={handleSeeOnMap}>
            <Text style={styles.mapButtonText}>See on Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    height: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  actionButton: {
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 55,
    height: 55,
    elevation: 3,
  },
  callButton: {
    backgroundColor: '#007AFF',
  },
  messageButton: {
    backgroundColor: '#34b7f1',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  emailButton: {
    backgroundColor: '#d44638',
  },
  infoContainer: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginTop: 10,
  },
  profileDetail: {
    fontSize: 16,
    marginVertical: 3,
    color: '#555',
  },
  boldText: {
    fontWeight: '600',
    color: '#333',
  },
  mapButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#FF8852",
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  shareButton: { backgroundColor: "#5856D6" },
  mapButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UserProfileScreen;
