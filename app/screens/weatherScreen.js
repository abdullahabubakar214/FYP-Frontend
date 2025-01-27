import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { getWeatherUpdates } from '../services/circleServices';
import { useRouter } from "expo-router";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { BackHandler } from "react-native";

const WeatherForecastScreen = () => {
  const [location, setLocation] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const router = useRouter();

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

  const fetchWeatherData = async () => {
    if (!location?.latitude || !location?.longitude) {
      setError("Location data is not available");
      return;
    }
  
    let expoPushToken = null;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
  
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
  
      if (finalStatus === 'granted') {
        expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        setError("Failed to get push token for push notifications");
        return;
      }
    } else {
      setError("Must use physical device for push notifications");
      return;
    }
  
    setLoading(true);
    try {
      const weatherData = await getWeatherUpdates(location.latitude, location.longitude, expoPushToken);
      console.log("API Response:", weatherData);
  
      if (weatherData.success) {
        setCurrentWeather(weatherData.weather.current);
  
        // Check for forecast structure and log it for debugging
        const forecastData = weatherData.weather.forecast?.forecastday || weatherData.weather.forecast || [];
        console.log("Forecast Data:", forecastData);
  
        // Set forecast with the correct structure
        setForecast(forecastData);
      } else {
        setError("Weather data is not available.");
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching weather data');
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        if (location?.coords) {
          setLocation(location.coords);
          console.log("Location retrieved:", location.coords);
          setLocationError(null); // Clear location error if successfully retrieved
        } else {
          setLocationError("Failed to retrieve location data");
        }
      } catch (err) {
        setLocationError(err.message || 'An error occurred while fetching location data');
      }
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherData();
    }
  }, [location]);

  const handleRefresh = () => {
    setLoading(true);
    fetchWeatherData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8852" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  if (locationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentWeather) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No weather data available.</Text>
      </View>
    );
  }

  const { temp_c, condition } = currentWeather;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Weather</Text>
      <View style={styles.weatherCard}>
        <Text style={styles.tempText}>{Math.round(temp_c)}°C</Text>
        <Text style={styles.conditionText}>{condition.text}</Text>
        <Image source={{ uri: `https:${condition.icon}` }} style={styles.weatherIcon} />
      </View>

      <Text style={styles.forecastTitle}>Next 3-Day Forecast</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {forecast.length > 0 ? (
          forecast.map((day) => (
            <View key={day.date} style={styles.forecastCard}>
              <Text style={styles.forecastDate}>{new Date(day.date).toLocaleDateString()}</Text>
              <Image source={{ uri: `https:${day.day.condition.icon}` }} style={styles.forecastIcon} />
              <Text style={styles.forecastTemp}>{Math.round(day.day.avgtemp_c)}°C</Text>
              <Text style={styles.forecastCondition}>{day.day.condition.text}</Text>
              <Text style={styles.forecastHumidity}>Humidity: {day.day.avghumidity}%</Text>
              <Text style={styles.forecastWind}>Wind: {Math.round(day.day.maxwind_kph)} kph</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No forecast data available.</Text>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.refreshButton} onPress={() => router.push("/screens/home")}>
        <Text style={styles.refreshButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FF8852',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  tempText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#333',
  },
  conditionText: {
    fontSize: 24,
    color: '#555',
    marginBottom: 10,
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  forecastTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
    textAlign: 'center',
  },
  forecastCard: {
    backgroundColor: '#ffffff',
    padding: 10, // Reduced padding for less vertical space
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 15,
    width: 120, // Keep width for a square shape
    height: 200, // Reduced height for a shorter card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  
  forecastDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  forecastIcon: {
    width: 50,
    height: 50,
    marginVertical: 5,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  forecastCondition: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#FF8852',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  forecastHumidity: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  forecastWind: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  
});

export default WeatherForecastScreen;
