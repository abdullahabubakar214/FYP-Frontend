import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Modal, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import UserProfileScreen from './UserProfileModal';
import { deleteCircle, deleteContactFromCircle } from '../../services/circleServices';

const ContactBottomSheet = ({ visible, onClose, contacts = [], currentUserId, selectedCircleId }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [locations, setLocations] = useState({});

  const currentUser = contacts.find(contact => contact.userId === currentUserId);
  const isCurrentUserAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    contacts.forEach(contact => {
      if (contact.location && !locations[contact.userId]) {
        const { latitude, longitude } = contact.location;
        fetchLocationData(contact.userId, latitude, longitude);
      }
    });
  }, [contacts]);

  const fetchLocationData = async (userId, latitude, longitude) => {
    try {
      const response = await fetch(
        `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=671be423c3cde679070422nrv79416b`
      );
      const data = await response.json();

      // Extract and format only the specified fields from the address
      const addressComponents = data?.address;
      const address = addressComponents
        ? `${addressComponents.amenity || ""}, ${addressComponents.road || ""}, ${addressComponents.village || ""}, ${addressComponents.state || ""}, ${addressComponents.country || ""}`
          .replace(/, ,/g, ',')
          .trim()
        : "Location not found";

      setLocations(prevLocations => ({ ...prevLocations, [userId]: address }));
    } catch (error) {
      console.error("Error fetching location:", error);
      setLocations(prevLocations => ({ ...prevLocations, [userId]: "Location not found" }));
    }
  };

  const handleRefreshLocation = (userId, latitude, longitude) => {
    fetchLocationData(userId, latitude, longitude);
  };

  const handleContactPress = (user) => {
    setSelectedUser(user);
  };

  const handleCloseProfile = () => {
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      "Delete User",
      "Are you sure you want to delete this user from the circle?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            const result = await deleteContactFromCircle(selectedCircleId, userId);
            Alert.alert(result.success ? "Success" : "Error", result.message);
          }
        }
      ]
    );
  };

  const handleLeaveCircle = () => {
    Alert.alert(
      "Leave Circle",
      "Are you sure you want to leave this circle?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            const result = await deleteContactFromCircle(selectedCircleId, currentUserId);
            Alert.alert(result.success ? "Success" : "Error", result.message);
            if (result.success) onClose();
          }
        }
      ]
    );
  };

  const handleDeleteCircle = () => {
    Alert.alert(
      "Delete Circle",
      "Are you sure you want to delete this circle?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            const result = await deleteCircle(selectedCircleId);
            Alert.alert(result.success ? "Success" : "Error", result.message);
            if (result.success) onClose();
          }
        }
      ]
    );
  };

  return (
    <>
      <Modal visible={visible && !selectedUser} animationType="slide" transparent>
  <View style={styles.sheetContainer}>
    <View style={styles.sheetContent}>
      <TouchableOpacity style={styles.closeIconContainer} onPress={onClose}>
        <MaterialIcons name="close" size={24} color="#000" />
      </TouchableOpacity>

      {/* Notebox */}
      <View style={styles.notebox}>
        <Text style={styles.noteboxText}>
          View contact details, locations, or manage members of the circle. Tap for more Details
        </Text>
      </View>

      <Text style={styles.sheetTitle}>Contacts</Text>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.flatListContainer}
        renderItem={({ item }) => {
          const isCurrentUser = item.userId === currentUserId;
          const contactIsAdmin = item.role === 'Admin';
          const address = locations[item.userId];

          const batteryColor = item.batteryPercentage > 80
            ? 'green'
            : item.batteryPercentage > 30
              ? 'orange'
              : 'red';

          return (
            <TouchableOpacity style={styles.contactContainer} onPress={() => handleContactPress(item)}>
              <View style={styles.contactHeader}>
                <View style={styles.contactImageName}>
                  {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
                  ) : (
                    <MaterialIcons name="person" size={40} color="#555" />
                  )}
                  <View>
                    <Text style={[styles.contactName, contactIsAdmin && styles.adminName]}>
                      {isCurrentUser ? 'You' : item.name}
                    </Text>
                    <Text style={styles.roleText}>{contactIsAdmin ? 'Admin' : 'Member'}</Text>
                  </View>
                </View>

                {isCurrentUserAdmin && !isCurrentUser && (
                  <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={() => handleDeleteUser(item.userId)}>
                      <MaterialIcons name="delete" size={24} color="#ff0000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRefreshLocation(item.userId, item.location.latitude, item.location.longitude)}>
                      <MaterialIcons name="refresh" size={24} color="#555" style={styles.refreshIcon} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.contactDetailsContainer}>
                {item.location ? (
                  <>
                    <Text style={styles.contactDetails}>
                      <MaterialIcons name="location-on" size={16} color="#555" /> Location: {item.location.latitude}, {item.location.longitude}
                    </Text>
                    <Text style={styles.contactDetails}>
                      <MaterialIcons name="map" size={16} color="#555" /> Address: {address || "Loading..."}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.contactDetails}>Location not available</Text>
                )}
                {item.batteryPercentage !== null ? (
                  <>
                    <Text style={styles.contactDetails}>
                      <MaterialIcons name="battery-full" size={16} color="#555" /> Battery: {item.batteryPercentage}%
                    </Text>
                    <View style={[styles.batteryBar, { width: `${item.batteryPercentage}%`, backgroundColor: batteryColor }]} />
                  </>
                ) : (
                  <Text style={styles.contactDetails}>Battery info not available</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No contacts available.</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {isCurrentUserAdmin ? (
        <TouchableOpacity style={styles.deleteCircleButton} onPress={handleDeleteCircle}>
          <MaterialIcons name="delete" size={24} color="white" />
          <Text style={styles.deleteCircleButtonText}>Delete Circle</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCircle}>
          <Text style={styles.leaveButtonText}>Leave Circle</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
</Modal>


      {selectedUser && (
        <UserProfileScreen
          user={selectedUser}
          visible={!!selectedUser}
          onClose={handleCloseProfile}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 15,
    maxHeight: '80%', // Limit modal height to 70% of the screen
  },
  flatListContainer: {
    maxHeight: 800, // Set max height to allow scrolling if content exceeds this height
  },
  closeIconContainer: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#333',
    textAlign: 'center',
  },
  contactContainer: {
    marginBottom: 18,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  contactImageName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
  },
  adminName: {
    fontWeight: 'bold',
    color: '#0056b3',
  },
  roleText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  contactDetailsContainer: {
    marginTop: 12,
  },
  contactDetails: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  leaveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteCircleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c0392b',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 24,
  },
  deleteCircleButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  batteryBar: {
    height: 12,
    width: '100%',
    backgroundColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
  },
  batteryFill: {
    height: '100%',
    borderRadius: 6,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshIcon: {
    marginLeft: 10, // Space between delete and refresh icons
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


export default ContactBottomSheet;
