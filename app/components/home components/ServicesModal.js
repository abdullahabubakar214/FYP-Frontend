import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { fetchServicesByCategory } from '../../services/circleServices'; // Import your API function

const placeTypes = {
  Medical: ['hospital', 'pharmacy', 'doctor', 'clinic'],
  Fire: ['fire_station'],
  Accident: ['car_repair', 'hospital', 'police'],
  Rescue: ['police', 'fire_station', 'emergency_rescue'],
  Violence: ['police', 'hospital', 'emergency_service'],
  Disaster: ['shelter', 'fire_station', 'police'],
  Utilities: ['electrician', 'plumber', 'repair_service'],
  Food: ['restaurant', 'supermarket', 'grocery_or_supermarket'],
  Shelter: ['hotel', 'lodging'],
  Veterinary: ['veterinary_care', 'pet_store'],
  Pharmacy: ['pharmacy', 'clinic'],
};

const ServicesModal = ({ visible, onClose, currentLocation }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch services when modal is visible and location is available
  useEffect(() => {
    if (visible && currentLocation) {
      setServices([]); // Reset services on modal open
      if (selectedType) {
        fetchServices(currentLocation.latitude, currentLocation.longitude, selectedType);
      }
    }
  }, [visible, currentLocation, selectedType]);

  // Fetch services using the provided API function
  const fetchServices = async (latitude, longitude, emergencyType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchServicesByCategory(latitude, longitude, emergencyType);
      if (response.success) {
        setServices(response.data.nearbyServices || []);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch services. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle type selection to fetch specific services
  const handleSelectType = (type) => {
    setSelectedType(type);
    // Reset services when the type changes
    setServices([]);
    fetchServices(currentLocation.latitude, currentLocation.longitude, type);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nearby Services</Text>
        {currentLocation && (
          <Text style={styles.locationText}>
            Your Location: {currentLocation.latitude}, {currentLocation.longitude}
          </Text>
        )}

        <View style={styles.typesContainer}>
          {Object.keys(placeTypes).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.selectedTypeButton,
              ]}
              onPress={() => handleSelectType(type)}
            >
              <Text style={styles.typeButtonText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && services.length === 0 ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.serviceCard}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceDetails}>Address: {item.address}</Text>
                <Text style={styles.serviceDetails}>Distance: {item.distance} km</Text>
                <Text style={styles.serviceDetails}>Rating: {item.rating}</Text>
              </View>
            )}
            ListEmptyComponent={
              !loading && services.length === 0 ? (
                <Text style={styles.noServicesText}>No services found.</Text>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: 'red',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 16,
    marginBottom: 10,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typeButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedTypeButton: {
    backgroundColor: '#0056b3',
  },
  typeButtonText: {
    color: '#fff',
  },
  serviceCard: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  serviceDetails: {
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  noServicesText: {
    textAlign: 'center',
    color: '#888',
  },
});

export default ServicesModal;
