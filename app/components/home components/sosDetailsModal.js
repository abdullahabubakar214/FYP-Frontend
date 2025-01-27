import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native';
import { getSOS } from '../../services/circleServices'; // Import the getSOS function
import { getCurrentUserId } from '../../firebase/firebaseauth'; // Import the function to get the current user ID
import { acknowledgeSOS } from '../../services/circleServices'; // Import the acknowledgeSOS function
import Icon from 'react-native-vector-icons/Ionicons'; // Import the icon library
import moment from 'moment';

const SOSDetailsModal = ({ isVisible, onClose }) => {
  const [sosList, setSosList] = useState([]); // Holds the fetched SOS list
  const [selectedSOS, setSelectedSOS] = useState(null); // Holds the selected SOS for expanded view
  const [loading, setLoading] = useState(true); // Loading state
  const [currentUserId, setCurrentUserId] = useState(null); // Store the current user ID

  // Animation state
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      fetchSOSDetails(); // Fetch the SOS data when the modal is visible
    }
  }, [isVisible]);

  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    };
    fetchUserId();
  }, []);

  const fetchSOSDetails = async () => {
    setLoading(true); // Show loading spinner
    try {
      const response = await getSOS(); // Fetch SOS list
      if (response.success) {
        // Filter and sort SOS list, excluding those sent by the current user
        const filteredSosList = response.data.filter((sos) => sos.sender.userId !== currentUserId);
        const sortedSosList = filteredSosList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setSosList(sortedSosList);
      } else if (response.message === 'No SOS found') {
        // Handle 404 (no SOS found) case gracefully
        setSosList([]); // Set an empty SOS list
      } else {
        console.error('Failed to fetch SOS details:', response.message); // Log unexpected errors
      }
    } catch (error) {
      console.error('Error fetching SOS details:', error.message || 'Unexpected error');
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };
  

  const handleAcknowledge = async (sosId) => {
    try {
      const response = await acknowledgeSOS(sosId, currentUserId);
      if (response.success) {
        Alert.alert('Acknowledgment Sent', 'Try to help the sender as soon as you can.');
        setSosList((prevSosList) =>
          prevSosList.map((sos) =>
            sos.id === sosId
              ? {
                ...sos,
                contacts: sos.contacts.map((contact) =>
                  contact.contactId === currentUserId ? { ...contact, acknowledged: true } : contact
                ),
              }
              : sos
          )
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to acknowledge SOS');
      }
    } catch (error) {
      console.error('Error acknowledging SOS:', error);
      Alert.alert('Error', 'Error acknowledging SOS. Please try again.');
    }
  };

  const toggleSelectedSOS = (sosId) => {
    setSelectedSOS((prevId) => (prevId === sosId ? null : sosId));
  };

  const isRecent = (timestamp) => {
    const now = new Date();
    const sosTime = new Date(timestamp);
    const diffInHours = (now - sosTime) / (1000 * 60 * 60); // Calculate the difference in hours
    return diffInHours <= 24; // Return true if the SOS was sent within the last 24 hours
  };
  

  // Start pulse animation for unacknowledged recent SOS
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
    <View style={styles.container}>
      <Text style={styles.title}>Current SOS's</Text>
      
      {/* Notebox */}
      <View style={styles.notebox}>
        <Text style={styles.noteboxText}>
          After Acknowledging the SOS quickly try to contact the sender.
          If you can't acknowledge a SOS, it means it is expired or cannot be acknowledged after 24 hours.
        </Text>
      </View>
  
      {loading ? (
        <ActivityIndicator size="large" color="#FF8852" />
      ) : sosList.length === 0 ? (
        <Text style={styles.noSOSText}>There are no active SOS currently.</Text>
      ) : (
        <FlatList
          data={sosList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const currentUserContact = item.contacts.find(
              (contact) => contact.contactId === currentUserId
            );
            const isAcknowledged = currentUserContact?.acknowledged || false;
            const circleName =
              item.circles && item.circles.length > 0 ? item.circles[0].name : 'Unknown Circle';
  
            const formattedTimestamp = moment(item.createdAt).format('MMMM Do YYYY, h:mm:ss a');
            if (!isAcknowledged && isRecent(item.timestamp)) {
              startPulseAnimation();
            }
  
            return (
              <TouchableOpacity onPress={() => toggleSelectedSOS(item.id)}>
                <Animated.View style={[styles.sosItem, { transform: [{ scale: pulseAnimation }] }]}>
                  <Text style={styles.sosText}>
                    SOS initialized by <Text style={styles.bold}>{item.sender.name}</Text> from{' '}
                    <Text style={styles.bold}>{item.sosDetails.userLocation}</Text> in{' '}
                    <Text style={styles.bold}>{circleName}</Text>.
                  </Text>
                  <Text style={styles.sosDetails}>Battery: {item.sender.batteryStatus}%</Text>
                  <Text style={styles.sosDetails}>Emergency Type: {item.sosDetails.emergencyType}</Text>
                  <Text style={styles.timestamp}>Timestamp: {formattedTimestamp}</Text>
  
                  <TouchableOpacity
                    style={[
                      styles.acknowledgeButton,
                      isAcknowledged ? styles.acknowledgedButton : null,
                    ]}
                    onPress={() => handleAcknowledge(item.id)}
                    disabled={isAcknowledged}
                  >
                    <Text style={styles.buttonText}>
                      {isAcknowledged ? 'You have acknowledged this SOS' : 'Acknowledge'}
                    </Text>
                  </TouchableOpacity>
  
                  {selectedSOS === item.id && (
                    <View style={styles.acknowledgedSection}>
                      <Text style={styles.acknowledgedTitle}>Acknowledged by:</Text>
                      {item.contacts
                        .filter((contact) => contact.acknowledged)
                        .map((contact, index) => (
                          <Text key={index} style={styles.contactName}>
                            {contact.name}
                          </Text>
                        ))}
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          }}
        />
      )}
  
      <TouchableOpacity style={styles.closeButton} onPress={fetchSOSDetails}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
  
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </Modal>
  
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: "#FF8852"
  },
  noSOSText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  listContainer: {
    paddingBottom: 20,
  },
  sosItem: {
    padding: 15,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sosText: {
    fontSize: 16,
    marginBottom: 5,
  },
  sosDetails: {
    fontSize: 14,
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
  },
  acknowledgedSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e0ffe0',
    borderRadius: 8,
  },
  acknowledgedButton: {
    backgroundColor: 'green',
  },
  acknowledgedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contactName: {
    fontSize: 14,
    color: '#333',
  },
  acknowledgeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FF8852',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF8852',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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

export default SOSDetailsModal;
