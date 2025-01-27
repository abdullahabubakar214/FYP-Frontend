import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    AppState,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { getEmergencyHelp } from "../services/circleServices"; // Adjust the import according to your file structure
import Markdown from 'react-native-markdown-display';
import { BackHandler } from "react-native";
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useRouter } from "expo-router";

const MESSAGES_KEY = "@chat_messages";

export default function App() {
    const [emergencyType, setEmergencyType] = useState("");
    const [customEmergencyType, setCustomEmergencyType] = useState("");
    const [userLocation, setUserLocation] = useState({ address: "", lat: null, lng: null });
    const [message, setMessage] = useState("I need Help!");
    const [chatMessages, setChatMessages] = useState([]);
    const [appState, setAppState] = useState(AppState.currentState);
    const [locationError, setLocationError] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isManualLocation, setIsManualLocation] = useState(false);
    const router = useRouter();

    const emergencyOptions = ["Fire", "Medical Emergency", "Accident", "Custom"];

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const storedMessages = await AsyncStorage.getItem(MESSAGES_KEY);
                if (storedMessages) {
                    setChatMessages(JSON.parse(storedMessages));
                }
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        };

        loadMessages();

        const subscription = AppState.addEventListener("change", handleAppStateChange);
        const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

        return () => {
            subscription.remove();
            backHandler.remove();
        };
    }, []);

    const handleAppStateChange = (nextAppState) => {
        setAppState(nextAppState);
        if (nextAppState === "background") {
            clearMessages();
        }
    };

    const clearMessages = async () => {
        await AsyncStorage.removeItem(MESSAGES_KEY);
        setChatMessages([]);
    };

    const handleBackPress = () => {
        router.push("/screens/home");
        return true; // Prevent default behavior
    };

    const handleSendMessage = async () => {
        const selectedEmergencyType =
            emergencyType === "Custom" ? customEmergencyType.trim() : emergencyType;

        if (!selectedEmergencyType) {
            Alert.alert("Error", "Please select or input an emergency type.");
            return;
        }

        if (!userLocation.address || !userLocation.lat || !userLocation.lng) {
            Alert.alert("Error", "Please get your location.");
            return;
        }

        const finalMessage = message.trim() || "I need help";

        const newMessage = {
            id: Date.now().toString(),
            type: "user",
            content: `Emergency Type: ${selectedEmergencyType}\nLocation: ${userLocation.address}\nMessage: ${finalMessage}`,
        };

        const updatedMessages = [...chatMessages, newMessage];
        setChatMessages(updatedMessages);

        try {
            await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));

            setIsTyping(true);

            const response = await getEmergencyHelp(
                selectedEmergencyType,
                userLocation.lat,
                userLocation.lng,
                finalMessage
            );

            const botMessageContent = response.success
                ? formatBotResponse(response.data)
                : response.message || "Error retrieving help information.";

            const botMessage = {
                id: Date.now().toString(),
                type: "bot",
                content: botMessageContent,
            };

            setChatMessages((prevMessages) => [...prevMessages, botMessage]);
            await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify([...updatedMessages, botMessage]));
        } catch (error) {
            console.error("Error sending message:", error);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setIsTyping(false);
            setEmergencyType("");
            setCustomEmergencyType("");
            setMessage("");
        }
    };

    const fetchLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "Permission to access location was denied.");
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        setUserLocation({ lat: latitude, lng: longitude, address: "Fetching address..." });

        try {
            const response = await fetch(
                `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=671be423c3cde679070422nrv79416b`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.address) {
                const formattedAddress = `${data.display_name || ""}, ${data.address.city || "Unknown"}, ${data.address.country || ""}`;
                setUserLocation((prev) => ({ ...prev, address: formattedAddress }));
            } else {
                setUserLocation((prev) => ({ ...prev, address: "Address not found" }));
            }
        } catch (error) {
            console.error("Error fetching address:", error);
            setUserLocation((prev) => ({ ...prev, address: "Error fetching address" }));
        }
    };

    const getCoordinatesFromAddress = async () => {
        if (!userLocation.address) {
            Alert.alert("Error", "Please enter a valid address.");
            return;
        }

        try {
            const response = await fetch(
                `https://geocode.maps.co/search?q=${encodeURIComponent(userLocation.address)}&api_key=671be423c3cde679070422nrv79416b`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setUserLocation((prev) => ({ ...prev, lat: parseFloat(lat), lng: parseFloat(lon) }));
            } else {
                Alert.alert("Error", "Unable to fetch coordinates for the entered address.");
            }
        } catch (error) {
            console.error("Error fetching coordinates:", error);
            Alert.alert("Error", "An unexpected error occurred while fetching coordinates.");
        }
    };

    const formatBotResponse = (data) => {
        if (!data) {
            return "Error: Unable to retrieve response data.";
        }

        // Fallback values for undefined or missing data
        const generatedResponse = data.generatedResponse || "No additional information provided.";

        // Process the markdown content:
        let formattedGeneratedResponse = generatedResponse
            .replace(/^## /gm, "### ")  // Convert markdown headings (##) to a smaller heading level
            .replace(/\n1\./g, "\n-")    // Change numbered lists to bullet points
            .replace(/(\d+\.)/g, "")     // Remove numbering from the list
            .trim();

        // Format the nearby services with a bullet point list
        const nearbyServices =
            data.nearbyServices && data.nearbyServices.length > 0
                ? data.nearbyServices
                    .map((service, index) => {
                        const name = service.name || "Unknown Service";
                        const address = service.address || "No address available";
                        const rating = service.rating ? `(Rating: ${service.rating}/5)` : "";
                        return `- ${name} - ${address} ${rating}`;
                    })
                    .join("\n")
                : "No nearby services found.";

        // Return markdown-formatted response
        return `
    I got you:
    
    Nearby Services:
    
    ${nearbyServices}
    
    Generated Response:

    ${formattedGeneratedResponse}
        `;
    };

    const renderMessageItem = ({ item }) => (
        <View
            style={[
                styles.messageContainer,
                item.type === "user" ? styles.userMessage : styles.botMessage,
            ]}
        >
            {item.type === "bot" ? (
                // Use Markdown to render the formatted response for bot messages
                <Markdown style={styles.messageText}>{item.content}</Markdown>
            ) : (
                <Text style={styles.messageText}>{item.content}</Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.push("/screens/home")} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>🤖 Chatbot for Emergencies</Text>
            </View>

            <FlatList
                data={chatMessages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatList}
            />
            {isTyping && (
                <View style={styles.typingContainer}>
                    <Text style={styles.typingText}>Bot is typing...</Text>
                </View>
            )}
            <View style={styles.inputContainer}>
                <Picker
                    selectedValue={emergencyType}
                    style={styles.picker}
                    onValueChange={(itemValue) => {
                        setEmergencyType(itemValue);
                        if (itemValue !== "Custom") {
                            setCustomEmergencyType("");
                        }
                    }}
                >
                    <Picker.Item label="Select Emergency Type" value="" />
                    {emergencyOptions.map((option) => (
                        <Picker.Item key={option} label={option} value={option} />
                    ))}
                </Picker>

                {emergencyType === "Custom" && (
                    <TextInput
                        style={styles.customInput}
                        placeholder="Enter Custom Type"
                        value={customEmergencyType}
                        onChangeText={setCustomEmergencyType}
                    />
                )}
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter location and search. Or press Location icon"
                    value={userLocation.address || ""}
                    onChangeText={(text) => {
                        setUserLocation((prev) => ({ ...prev, address: text }));
                        setIsManualLocation(true);
                    }}
                />
                <TouchableOpacity style={[styles.iconButton, styles.locationIcon]} onPress={fetchLocation}>
                    <Ionicons name="location-outline" size={24} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconButton, styles.searchIcon]} onPress={getCoordinatesFromAddress}>
                    <Ionicons name="search" size={24} color="gray" />
                </TouchableOpacity>
            </View>

            {locationError && <Text style={styles.errorText}>{locationError}</Text>}

            <View style={styles.messageInputContainer}>
                <TextInput
                    style={styles.messageInput}
                    placeholder="I need Help!" // Default placeholder
                    value={message}
                    onChangeText={setMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 10,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FF8852",
        textAlign: "center",
        marginVertical: 20,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: "#f8f8f8",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
        marginTop: 20,
    },
    backButton: {
        marginRight: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },

    chatList: {
        flexGrow: 1,
        paddingBottom: 10,
    },
    messageContainer: {
        padding: 15,
        borderRadius: 10,
        marginVertical: 5,
    },
    userMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#FF8852",
        maxWidth: "80%",
    },
    botMessage: {
        alignSelf: "stretch", // Makes the message container stretch across the full width
        backgroundColor: "#e1e1e1",
        padding: 15, // Adds padding inside the message box
        borderRadius: 10, // Keeps the rounded edges
        marginVertical: 5, // Adds spacing between messages
        maxWidth: "100%",
    },

    messageText: {
        color: "#000",
        fontSize: 16,
    },
    markdown: {
        // Heading styles
        heading: {
            fontSize: 20,
            fontWeight: "bold",
            color: "#FF8852",
            marginBottom: 8,
        },
        heading1: {
            fontSize: 24,
            fontWeight: "bold",
            color: "#FF8852",
            marginBottom: 12,
        },
        heading2: {
            fontSize: 24,
            fontWeight: "bold",
            color: "#FF8852",
            marginBottom: 10,
        },
        heading3: {
            fontSize: 24,
            fontWeight: "bold",
            color: "#FF8852",
            marginBottom: 6,
        },
        // Paragraph style
        paragraph: {
            fontSize: 18,
            color: "#333",
            lineHeight: 22,
            marginBottom: 12,
        },
        // List style
        listItem: {
            fontSize: 18,
            color: "#333",
            marginBottom: 5,
            marginLeft: 20,
            lineHeight: 22,
        },
        // Inline bold text
        strong: {
            fontWeight: "bold",
            color: "#FF8852",
        },
        // Inline italic text
        em: {
            fontStyle: "italic",
            color: "#555",
        },
        // Links
        link: {
            color: "#FF8852",
            textDecorationLine: "underline",
        },
        // Code block styling
        codeBlock: {
            fontFamily: "Courier New",
            backgroundColor: "#f1f1f1",
            padding: 10,
            borderRadius: 5,
            marginVertical: 8,
        },
        // Inline code styling
        codeInline: {
            fontFamily: "Courier New",
            backgroundColor: "#f1f1f1",
            paddingVertical: 2,
            paddingHorizontal: 5,
            borderRadius: 3,
            fontSize: 14,
        },
        // Blockquote styling
        blockquote: {
            borderLeftWidth: 4,
            borderLeftColor: "#FF8852",
            paddingLeft: 15,
            fontStyle: "italic",
            color: "#555",
            marginVertical: 12,
            fontSize: 16,
        },
    },
    inputContainer: {
        position: 'relative',
        width: '100%',
        marginVertical: 10,
    },

    picker: {
        height: 50,
        width: "100%",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#FF8852",
        borderRadius: 10,
        backgroundColor: "#f9f9f9",
    },
    customInput: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingLeft: 15,
        paddingRight: 80, // Adjusted to accommodate both icons
        backgroundColor: '#f9f9f9',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingLeft: 15,
        paddingRight: 80, // Adjusted to accommodate both icons
        backgroundColor: '#f9f9f9',
    },

    iconButton: {
        position: 'absolute',
        top: 13, // Vertically aligns the icons in the center of the input field
        zIndex: 1,
    },
    locationIcon: {
        right: 50, // Places the location icon towards the left of the search icon
        backgroundColor: '#FF8852',
        padding: 5, // Add padding around the icon
        borderRadius: 50, // Makes the background circular
        alignItems: 'center', // Center the icon within the background
        justifyContent: 'center',
    },

    searchIcon: {
        right: 10, // Places the search icon at the far-right
        backgroundColor: '#4CAF50',
        padding: 5, // Add padding around the icon
        borderRadius: 50, // Makes the background circular
        alignItems: 'center', // Center the icon within the background
        justifyContent: 'center',
    },

    messageInputContainer: {
        flexDirection: "row",
        paddingVertical: 5,
        borderTopWidth: 1,
        borderColor: "#ddd",
    },
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#FF8852",
        borderRadius: 10,
        padding: 10,
        marginRight: 10,
        backgroundColor: "#f9f9f9",
    },
    sendButton: {
        backgroundColor: "#FF8852",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    sendButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    locationButton: {
        backgroundColor: "#FF8852",
        padding: 10,
        borderRadius: 10,
        marginTop: 10,
    },
    locationButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    errorText: {
        color: "red",
        fontSize: 12,
        textAlign: "center",
        marginTop: 5,
    },
    typingContainer: {
        alignItems: "center",
        marginTop: 10,
    },
    typingText: {
        fontStyle: "italic",
        color: "#888",
    },
});
