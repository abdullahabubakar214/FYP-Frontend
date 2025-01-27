import axios from 'axios';
import { getToken, refreshToken, getCurrentUserId } from '../firebase/firebaseauth'; // Helper functions for token management

const BASE_URL = 'http://127.0.0.1:5001/first-project-3c315/us-central1/api';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  let token = await getToken();
  if (!token) {
    token = await refreshToken(); // Refresh token if expired or unavailable
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Fetch created circles
export const fetchCreatedCircles = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/circles/created`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const errorResponse = await response.json();
      if (response.status === 404) {
        return { success: false, message: errorResponse.message }; // Return custom message for 404
      }
      throw new Error('Failed to fetch created circles');
    }

    const data = await response.json();
    const circleIds = data.map(circle => circle._id); // Extract circle IDs
    const circleCodes = data.map(circle => circle.circleCode); // Extract circle codes

    return { success: true, data, circleIds, circleCodes }; // Return success with data and new variables
  } catch (error) {
    console.error('Error fetching created circles:', error);
    return { success: false, message: error.message }; // Return generic error message
  }
};

// Fetch joined circles
export const fetchJoinedCircles = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/circles/joined`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const errorResponse = await response.json();
      if (response.status === 404) {
        return { success: false, message: errorResponse.message }; // Return custom message for 404
      }
      throw new Error('Failed to fetch joined circles');
    }

    const data = await response.json();
    const circleIds = data.map(circle => circle._id); // Extract circle IDs
    const circleCodes = data.map(circle => circle.circleCode); // Extract circle codes

    return { success: true, data, circleIds, circleCodes }; // Return success with data and new variables
  } catch (error) {
    console.error('Error fetching joined circles:', error);
    return { success: false, message: error.message }; // Return generic error message
  }
};

// Create a new circle
export const createCircle = async (circleData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/circles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(circleData),
    });
    if (!response.ok) {
      const errorResponse = await response.json(); // Get error response for further details
      throw new Error(errorResponse.message || 'Failed to create circle');
    }
    return { success: true, data: await response.json() }; // Return success with data
  } catch (error) {
    console.error('Error creating circle:', error);
    return { success: false, message: error.message }; // Return generic error message
  }
};

// Join an existing circle
export const joinCircle = async (circleCode) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/circles/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ circleCode }),
    });
    if (!response.ok) {
      const errorResponse = await response.json(); // Get error response for further details
      throw new Error(errorResponse.message || 'Failed to join circle');
    }
    return { success: true, data: await response.json() }; // Return success with data
  } catch (error) {
    console.error('Error joining circle:', error);
    return { success: false, message: error.message }; // Return generic error message
  }
};

// Fetch contacts in a circle, including the admin
export const fetchContactsInCircle = async (circleId) => {
  try {
    const headers = await getAuthHeaders();
    console.log(`Fetching contacts for Circle ID: ${circleId}`); // Log Circle ID being used
    const response = await fetch(`${BASE_URL}/circles/${circleId}/contacts`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to fetch contacts');
    }

    const data = await response.json();
    console.log("Fetched contacts data:", data); // Log fetched data

    if (!data.contacts || !Array.isArray(data.contacts)) {
      console.warn("No contacts found or invalid contacts structure");
      return { success: true, data: { contacts: [] } }; // Return an empty array if no contacts found
    }

    // Process contacts to extract roles and include userId
    const contacts = data.contacts.map(contact => ({
      userId: contact.userId, // Include userId in the processed contact
      name: contact.name,
      email: contact.email,
      phoneNumber: contact.phoneNumber,
      location: contact.location,
      batteryPercentage: contact.batteryPercentage,
      profileImage: contact.profileImage,
      status: contact.status,
      role: contact.role === 'admin' ? 'Admin' : 'Member', // Map to display roles
    }));

    return { success: true, data: { contacts } };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return { success: false, message: error.message };
  }
};

// Delete a contact from a circle
export const deleteContactFromCircle = async (circleId, contactId) => {
  try {
    const headers = await getAuthHeaders();
    console.log(`Deleting contact with ID: ${contactId} from Circle ID: ${circleId}`); // Log Circle ID and contact ID

    const response = await fetch(`${BASE_URL}/circles/${circleId}/contacts/${contactId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to delete contact');
    }

    const data = await response.json();
    console.log('Contact deleted successfully:', data); // Log success message

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error deleting contact:', error);
    return { success: false, message: error.message };
  }
};

// Delete a circle
export const deleteCircle = async (circleId) => {
  try {
    const headers = await getAuthHeaders();
    console.log(`Deleting circle with ID: ${circleId}`); // Log Circle ID

    const response = await fetch(`${BASE_URL}/circles/${circleId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to delete circle');
    }

    const data = await response.json();
    console.log('Circle deleted successfully:', data); // Log success message

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error deleting circle:', error);
    return { success: false, message: error.message };
  }
};

// Update location and battery status for a contact
export const updateLocationAndBattery = async (contactId) => {
  try {
    // Request location permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    // Get the location and battery info
    const location = await Location.getCurrentPositionAsync({});
    const batteryLevel = await Battery.getBatteryLevelAsync();

    // Construct the payload with location and battery
    const payload = {
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      batteryPercentage: batteryLevel * 100, // Battery level is a float, multiply by 100 for percentage
    };

    // Get auth headers
    const headers = await getAuthHeaders();

    // Send request to backend
    const response = await fetch(`${BASE_URL}/contacts/${contactId}/location`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to update location and battery');
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error updating location and battery:', error);
    return { success: false, message: error.message };
  }
};

// Fetch user profile data
export const getUserProfile = async (uid) => {

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${BASE_URL}/users/${uid}`, {
      method: 'GET',
      headers,
    });
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      throw new Error(`Unexpected response format: ${textResponse}`);
    }

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to fetch user profile');
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, message: error.message };
  }
  
};

export const createOrUpdateQRCode = async (userData) => {
  try {
    const headers = await getAuthHeaders();
    const userId = await getCurrentUserId(); // Get current user's ID

    const response = await fetch(`${BASE_URL}/qr-codes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...userData,
        userId, // Use current user's ID
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to create/update QR code');
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error creating/updating QR code:', error);
    return { success: false, message: error.message };
  }
};

export const getQRCodeDetails = async () => {
  try {
    const headers = await getAuthHeaders();
    const userId = await getCurrentUserId(); // Get current user's ID

    const response = await fetch(`${BASE_URL}/qr-codes`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to fetch QR code details');
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error fetching QR code details:', error);
    return { success: false, message: error.message };
  }
};

export const deleteQRCode = async () => {
  try {
    const headers = await getAuthHeaders();
    const userId = await getCurrentUserId(); // Get current user's ID

    const response = await fetch(`${BASE_URL}/qr-codes`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || 'Failed to delete QR code');
    }

    return { success: true, message: 'QR code deleted successfully' };
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return { success: false, message: error.message };
  }
};

export const getUserCardData = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/getUserCardData/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // Ensure request is for JSON response
      },
    });

    // Check response is JSON; if not, it may be HTML (error) response
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      const errorMessage = contentType.includes('application/json')
        ? (await response.json()).message
        : 'Unexpected error occurred';

      throw new Error(errorMessage);
    }

    // Parse JSON if response is JSON
    if (contentType.includes('application/json')) {
      return { success: true, data: await response.json() };
    } else {
      throw new Error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error fetching user card data:', error);
    return { success: false, message: error.message };
  }
};

// Send SOS
export const sendSOS = async (sosData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/sos`, sosData, { headers });

    if (response.status === 200) {
      return { success: true, data: response.data }; // SOS sent successfully
    } else {
      return { success: false, message: 'Failed to send SOS' }; // Handle unsuccessful request
    }
  } catch (error) {
    console.error('Error sending SOS:', error);
    return { success: false, message: error.message || 'Server error' }; // Return error message
  }
};

// Send SOS to all circles
export const sendSOSToAllCircles = async (sosData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/sos/sendToAll`, sosData, { headers });

    if (response.status === 200) {
      return { success: true, data: response.data }; // SOS sent successfully
    } else {
      return { success: false, message: 'Failed to send SOS to all circles' }; // Handle unsuccessful request
    }
  } catch (error) {
    console.error('Error sending SOS to all circles:', error);
    return { success: false, message: error.message || 'Server error' }; // Return error message
  }
};


// Acknowledge SOS
export const acknowledgeSOS = async (sosId, contactId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${BASE_URL}/sos/acknowledge`,
      { sosId, contactId },
      { headers }
    );

    // Handle success case
    if (response.status === 200) {
      return { success: true, data: response.data };
    }

    // Handle specific error cases
    if (response.status === 409) {
      return { success: false, message: 'You have already acknowledged this SOS.' };
    }

    // Catch-all for other statuses (should rarely happen)
    return { success: false, message: 'Failed to acknowledge SOS.' };
  } catch (error) {
    // Handle errors coming from Axios
    if (error.response) {
      if (error.response.status === 404) {
        return { success: false, message: 'SOS not found.' };
      }
      // Handle any other known statuses here
    }

    // Catch generic errors
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
};

export const getSOS = async () => {
  try {
    const headers = await getAuthHeaders(); // Get auth headers for the request
    const response = await axios.get(`${BASE_URL}/sos-details`, { headers });

    if (response.status === 200) {
      const sosData = response.data;
      
      // Check if there's any SOS data
      if (sosData.length === 0) {
        return {
          success: true,
          message: 'No SOS for today',
          data: [], // Return empty array for data
          ids: []   // Return empty array for ids
        };
      }

      // Extract SOS IDs and details
      const sosIds = sosData.map(sos => sos.id); // Extract SOS IDs into a separate variable

      return { 
        success: true, 
        data: sosData,  // Return SOS details successfully
        ids: sosIds // Return SOS IDs separately
      }; 
    } else {
      return { success: false, message: 'Failed to fetch SOS details' }; // Handle unsuccessful request
    }
  } catch (error) {
    console.error('Error fetching SOS details:', error);
    return { success: false, message: error.message || 'Server error' }; // Return error message
  }
};

export const getFullSOSByUserId = async (userId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/sos-details/user/${userId}`, { headers });

    if (response.status === 200) {
      const sosData = response.data;
      console.log('SOS Data:', sosData);

      if (sosData.length === 0) {
        return {
          success: true,
          message: `No SOS requests found for user ${userId}`,
          data: [],
        };
      }

      return { 
        success: true, 
        data: sosData,
      }; 
    }
    // Add additional status check if needed
    return { success: false, message: `Failed to fetch SOS details for user ${userId}` };
    
  } catch (error) {
    console.error('Error fetching SOS details:', error);
    return { success: false, message: error.message || 'Server error' };
  }
};

export const deleteSOSByUserId = async (userId, sosId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${BASE_URL}/sos-details/user/${userId}/sos/${sosId}`, { headers });

    if (response.status === 200) {
      return { success: true, message: 'SOS request deleted successfully.' };
    }

    return { success: false, message: 'Failed to delete SOS request.' };
  } catch (error) {
    console.error('Error deleting SOS:', error);
    return { success: false, message: error.response?.data?.message || 'Server error' };
  }
};

export const getWeatherUpdates = async (lat, lon, expoPushToken) => {
  try {
    const headers = await getAuthHeaders(); // Get auth headers for the request
    const response = await axios.get(`${BASE_URL}/weather-updates`, {
      headers,
      params: { lat, lon, expoPushToken }
    });

    console.log("API Request Params:", { lat, lon, expoPushToken }); // Log all request params
    console.log("API Response:", response.data); // Log the full response data

    if (response.status === 200) {
      const weatherData = response.data;

      const currentWeather = weatherData.weather?.current || null;
      const forecast = weatherData.weather?.forecast?.forecastday || [];

      return {
        success: true,
        weather: {
          current: currentWeather,
          forecast: forecast,
        },
        severeWeatherAlert: weatherData.weather?.alerts && weatherData.weather.alerts.length > 0,
        trafficAlert: null
      };
    } else {
      return { success: false, message: 'Failed to fetch weather updates' };
    }
  } catch (error) {
    console.error('Error fetching weather updates:', error.response?.data || error.message); // Improved error logging
    return { success: false, message: error.response?.data?.message || error.message || 'Server error' };
  }
};

// Function to call the get-help API
export const getEmergencyHelp = async (emergencyType, latitude, longitude, message) => {
  try {
    const headers = await getAuthHeaders(); // Get the authorization headers (if needed)
    
    const response = await axios.post(
      `${BASE_URL}/get-help`, 
      { emergencyType, latitude, longitude, message },
      { headers }
    );

    if (response.status === 200 && response.data?.success) {
      return { success: true, data: response.data.data }; // Return the API's data field
    }

    return { success: false, message: response.data?.error || 'Failed to retrieve help.' }; // Handle API-provided errors
  } catch (error) {
    console.error('Error getting emergency help:', error);
    const serverErrorMessage = error.response?.data?.error || 'Unable to connect to the server.';
    return { success: false, message: serverErrorMessage }; // Propagate server errors
  }
};


/*
export const createSignals = async (signalData) => {
  try {
    const headers = await getAuthHeaders(); // Get auth headers for the request
    const response = await axios.post(`${BASE_URL}/Signal`, signalData, { headers });

    if (response.status === 201) {
      return { 
        success: true, 
        message: 'Signal created successfully', 
        data: response.data.signal 
      };
    } else {
      return { success: false, message: 'Failed to create signal' };
    }
  } catch (error) {
    console.error('Error creating signal:', error);
    return { success: false, message: error.message || 'Server error' };
  }
};


export const getSignalsByUserIdAndCircleId = async (userId, circleId) => {
  try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${BASE_URL}/Signal/user/${userId}/circle/${circleId}`, { headers });

      if (response.status === 200) {
          const signalData = response.data;

          if (signalData.length === 0) {
              return {
                  success: true,
                  message: 'No active signals for this user and circle',
                  data: [],
                  ids: []
              };
          }

          const signalIds = signalData.map(signal => signal._id);
          return {
              success: true,
              data: signalData,
              ids: signalIds
          };
      } else {
          return { success: false, message: 'Failed to fetch user signals' };
      }
  } catch (error) {
      console.error('Error fetching user signals:', error);
      return { success: false, message: error.message || 'Server error' };
  }
};


export const deleteSignal = async (signalId) => {
  try {
    const headers = await getAuthHeaders(); // Get auth headers for the request
    const response = await axios.delete(`${BASE_URL}/Signal/${signalId}`, { headers });

    if (response.status === 200) {
      return { success: true, message: 'Signal deleted successfully' };
    } else {
      return { success: false, message: 'Failed to delete signal' };
    }
  } catch (error) {
    console.error('Error deleting signal:', error);
    return { success: false, message: error.message || 'Server error' };
  }
};

export const getSignalsByCircleId = async (circleId) => {
  try {
    const headers = await getAuthHeaders(); // Get auth headers for the request
    const response = await axios.get(`${BASE_URL}/Signal/circle/${circleId}`, { headers });

    if (response.status === 200) {
      const signalData = response.data;

      // Check if there are any signals
      if (signalData.length === 0) {
        return {
          success: true,
          message: 'No active signals for this circle',
          data: [],
          ids: []
        };
      }

      // Extract signal IDs
      const signalIds = signalData.map(signal => signal._id);

      return {
        success: true,
        data: signalData,
        ids: signalIds
      };
    } else {
      return { success: false, message: 'Failed to fetch signals for this circle' };
    }
  } catch (error) {
    console.error('Error fetching signals by circle ID:', error);
    return { success: false, message: error.message || 'Server error' };
  }
};
*/