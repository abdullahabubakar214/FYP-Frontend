import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { getFullSOSByUserId, deleteSOSByUserId } from '../services/circleServices';
import { getCurrentUserId } from '../firebase/firebaseauth';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BackHandler } from "react-native";
import { useRouter } from "expo-router"; // For navigation

// Enable Layout Animation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const UserSos = () => {
  const [sosData, setSosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSOS, setExpandedSOS] = useState(null);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    const fetchSOSData = async () => {
      setLoading(true);
      try {
        const userId = await getCurrentUserId();
        const response = await getFullSOSByUserId(userId);
        if (response.success) {
          // Sort the data by createdAt in descending order
          const sortedData = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setSosData(sortedData);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Failed to load SOS data.');
      } finally {
        setLoading(false);
      }
    };
    fetchSOSData();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => {
        backHandler.remove();
    };
}, []);

const handleBackPress = () => {
  router.push("/screens/home"); 
  return true; // Prevent default behavior
};

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSOS(expandedSOS === id ? null : id);
  };

  const handleDelete = async (sosId) => {
    const userId = await getCurrentUserId(); 
    const response = await deleteSOSByUserId(userId, sosId);

    if (response.success) {
      setSosData((prevData) => prevData.filter((item) => item.id !== sosId));
    } else {
      alert(response.message);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" color="#FF8852" />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  const renderSOSItem = ({ item }) => {
    const isExpanded = expandedSOS === item.id;
    const circleName = item.circles && item.circles.length > 0 ? item.circles[0].circleName : 'N/A';

    return (
      <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.sosCard}>
        <View style={styles.sosHeader}>
          <Text style={styles.emergencyType}>Emergency: {item.emergencyType}</Text>
          <Text style={styles.message}>Message: {item.message}</Text>
          <Text style={styles.location}>Location: {item.userLocation.address}</Text>
          <Text style={styles.circleName}>Circle: {circleName}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteIcon}>
            <Icon name="trash" size={20} color="#FF8852" />
          </TouchableOpacity>
        </View>
        {isExpanded && (
          <View style={styles.sosDetails}>
            <Text style={styles.detailText}>Battery: {item.batteryStatus}%</Text>
            <Text style={styles.detailText}>Sent: {new Date(item.createdAt).toLocaleString()}</Text>
            <Text style={styles.contactsHeader}>Contacts Notified:</Text>
            <FlatList
              data={item.contacts}
              keyExtractor={(contact) => contact.id}
              renderItem={({ item: contact }) => (
                <View style={styles.contactRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.notificationStatus}>
                    Acknowledged: {contact.acknowledged ? 'Yes' : 'No'}
                  </Text>
                </View>
              )}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>User SOS Requests</Text>
      </View>
      {sosData.length === 0 ? (
        <Text style={styles.noData}>No SOS requests found.</Text>
      ) : (
        <FlatList
          data={sosData}
          keyExtractor={(item) => item.id}
          renderItem={renderSOSItem}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false} // Hides the scrollbar
        />
      )}
    </View>
  );
};

export default UserSos;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8852',
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 3,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backIcon: {
    marginRight: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  sosCard: {
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderColor: '#ddd',
    borderWidth: 1,
    position: 'relative',
  },
  sosHeader: {
    marginBottom: 5,
  },
  emergencyType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8852',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginVertical: 5,
  },
  location: {
    fontSize: 15,
    color: '#555',
  },
  circleName: {
    fontSize: 15,
    color: '#2980b9',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  sosDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FF8852',
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  contactsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8852',
    marginTop: 10,
    marginBottom: 5,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FF8852',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  notificationStatus: {
    fontSize: 14,
    color: '#555',
  },
  noData: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
});
