import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location'; // Import expo-location
import { Ionicons } from '@expo/vector-icons';
import { createSignal, getSignalsByUserIdAndCircleId, deleteSignal, getSignalsByCircleId } from '../../services/circleServices'; // Import your API functions
import { getCurrentUserId } from '../../firebase/firebaseauth'; // Import to get userId

export default function SignalScreen({ selectedCircleId, currentCircleName, onPressClose }) {
    const [signalMessage, setSignalMessage] = useState(''); // Default message
    const [radius, setRadius] = useState(''); // Default radius
    const [duration, setDuration] = useState(''); // Default duration
    const [durationUnit, setDurationUnit] = useState(''); // Default duration unit
    const [locationText, setLocationText] = useState(''); // User's location text
    const [lat, setLat] = useState(null); // User's latitude
    const [lng, setLng] = useState(null); // User's longitude
    const [signals, setSignals] = useState([]);
    const [tab, setTab] = useState('circle'); // Default to 'circle' tab
    const [loading, setLoading] = useState(false); // Loading state

    useEffect(() => {
        // Dynamically set the message based on the locationText, duration, and durationUnit
        setSignalMessage(`Hi, I am here at ${locationText} for ${duration} ${durationUnit}! If you need any help you can have me at your side any time.`);
    }, [locationText, duration, durationUnit]);
    

    useEffect(() => {
        if (tab === 'circle') {
            fetchCircleSignals(); // Fetch circle signals on mount
        } else {
            fetchUserSignals(); // Fetch user signals on mount
        }
        getUserLocation(); // Fetch user location on mount
    }, [tab]);

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setLat(location.coords.latitude);
                setLng(location.coords.longitude);

                // Reverse geocoding to get location text
                const reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
                if (reverseGeocode.length > 0) {
                    const { city, country } = reverseGeocode[0]; // Get city and country from the reverse geocode result
                    setLocationText(`${city}, ${country}`); // Set the location text
                } else {
                    setLocationText(`Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}`);
                }
            } else {
                Alert.alert('Location permission denied');
            }
        } catch (error) {
            Alert.alert('Error fetching location', error.message);
        }
    };

    const fetchUserSignals = async () => {
        setLoading(true);
        try {
            const userId = await getCurrentUserId(); // Get userId
            const response = await getSignalsByUserIdAndCircleId(userId, selectedCircleId); // Call the API function with both userId and circleId
    
            if (response.success) {
                setSignals(response.data);
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            Alert.alert('Error fetching signals', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCircleSignals = async () => {
        setLoading(true);
        try {
            const response = await getSignalsByCircleId(selectedCircleId);
            console.log("current circel: ", selectedCircleId);
            if (response.success) {
                setSignals(response.data);
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            Alert.alert('Error fetching circle signals', error.message);
        } finally {
            setLoading(false);
        }
    };

    const circleId = selectedCircleId;

    const handleCreateSignal = async () => {
        try {
            const userId = await getCurrentUserId(); // Get userId from token or session
            const signalData = {
                userId,
                circleId,
                locationText,
                lat,
                lng,
                radius: Number(radius),
                duration: Number(duration),
                durationUnit,
                message: signalMessage,
            };

            const response = await createSignal(signalData);
            if (response.success) {
                Alert.alert('Success', response.message);
                fetchUserSignals(); // Refresh the list of signals
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            console.error('Error creating signal:', error);
            Alert.alert('Error', 'Error creating signal');
        }
    };

    const handleDeleteSignal = async (id) => {
        try {
            const response = await deleteSignal(id);
            if (response.success) {
                Alert.alert('Success', response.message);
                fetchUserSignals(); // Refresh the signals after deletion
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error) {
            Alert.alert('Error deleting signal', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manage Signals</Text>
                <TouchableOpacity onPress={onPressClose}>
                    <Ionicons name="close-outline" size={28} marginTop={4} />
                </TouchableOpacity>
            </View>

            {/* Create Signal Section */}
            <View style={styles.createSignal}>
                <Text style={styles.sectionTitle}>Create a Signal</Text>
                <Text>Current Location: {locationText}</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter signal message"
                    value={signalMessage}
                    onChangeText={setSignalMessage}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Enter radius in meters"
                    value={radius}
                    onChangeText={setRadius}
                    keyboardType="numeric"
                />
                <Text style={styles.radiusInfo}>
                    The radius defines the area around your location where the signal will be active.
                </Text>

                <View style={styles.durationContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Duration"
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Duration Unit (minutes, hours, days, weeks, months)"
                        value={durationUnit}
                        onChangeText={setDurationUnit}
                    />
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateSignal}>
                    <Text style={styles.buttonText}>Create Signal</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs for signals */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={tab === 'user' ? styles.activeTab : styles.tab}
                    onPress={() => {
                        setTab('user');
                        fetchUserSignals();
                    }}
                >
                    <Text style={tab === 'user' ? styles.activeTabText : styles.tabText}>My Signals</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={tab === 'circle' ? styles.activeTab : styles.tab}
                    onPress={() => {
                        setTab('circle');
                        fetchCircleSignals();
                    }}
                >
                    <Text style={tab === 'circle' ? styles.activeTabText : styles.tabText}>Circle Signals</Text>
                </TouchableOpacity>
            </View>

            {/* Signals List */}
            <FlatList
                data={signals}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.signalItem}>
                        <Text style={styles.signalText}>{item.message} - {item.locationText}</Text>
                        <Text style={styles.expirationText}>Expires: {new Date(item.expirationDate).toLocaleString()}</Text>

                        {/* Show "Created by" only in the Circle Signals tab */}
                        {tab === 'circle' && (
                            <Text style={styles.creatorText}>
                                Created by: <Text style={styles.boldText}>{item.createdBy}</Text>
                            </Text>
                        )}

                        <View style={styles.actionButtons}>
                            {/* Show delete button only in 'My Signals' tab */}
                            {tab === 'user' && (
                                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSignal(item._id)}>
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.viewButton} onPress={() => Alert.alert('View Signal', item.message)}>
                                <Text style={styles.viewButtonText}>View</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                refreshing={loading}
                onRefresh={tab === 'user' ? fetchUserSignals : fetchCircleSignals} // Refresh based on active tab
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f4f4f4',
    },
    creatorText: {
        fontSize: 14,
        color: '#333', // Change to your desired color
    },
    boldText: {
        fontWeight: 'bold', // Makes the text bold
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    createSignal: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    radiusInfo: {
        fontSize: 12,
        color: '#555',
        marginBottom: 8,
    },
    durationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    createButton: {
        backgroundColor: 'blue',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
    },
    tab: {
        padding: 10,
        marginHorizontal: 10,
        borderBottomWidth: 2,
        borderColor: 'transparent',
    },
    activeTab: {
        padding: 10,
        marginHorizontal: 10,
        borderBottomWidth: 2,
        borderColor: 'blue',
    },
    tabText: {
        fontSize: 16,
        color: '#888',
    },
    activeTabText: {
        fontSize: 16,
        color: 'blue',
        fontWeight: 'bold',
    },
    signalItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    signalText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    expirationText: {
        fontSize: 12,
        color: '#555',
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    viewButton: {
        backgroundColor: '#4caf50',
        padding: 8,
        borderRadius: 8,
    },
    viewButtonText: {
        color: '#fff',
    },
    deleteButton: {
        backgroundColor: 'red',
        padding: 8,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#fff',
    },
});
