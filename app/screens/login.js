import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Image,
  Easing,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { signIn, resetPassword } from '../firebase/firebaseauth';
import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseauth";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get("window");

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim1 = useRef(new Animated.Value(0)).current;
  const bounceAnim2 = useRef(new Animated.Value(0)).current;
  const bounceAnim3 = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const auth = getAuth();

  const bounceAnimation = (animatedValue) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -10,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
  };

  useEffect(() => {
    if (loading) {
      bounceAnimation(bounceAnim1).start();
      setTimeout(() => bounceAnimation(bounceAnim2), 100);
      setTimeout(() => bounceAnimation(bounceAnim3).start(), 200);
    }
  }, [loading]);

  // Function to request permission and get Expo push token
  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    Animated.timing(fadeAnim, {
      toValue: 0.5,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      const result = await signIn(email, password);
      if (result.success) {
        const user = auth.currentUser;

        // Reload user to get the latest email verification status
        await user.reload();

        if (!user.emailVerified) {
          Alert.alert('Error', 'Please verify your email before logging in.');
          setLoading(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          return;
        }

        // Get and store the Expo push token
        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
          await updateDoc(doc(db, "users", user.uid), {
            expoPushToken,  // Store push token to Firestore
            emailVerified: true,
          });
        }

        // Redirect to home screen
        router.push("/screens/home");
      } else {
        Alert.alert("Error", "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleForgotPassword = async () => {
    if (email.trim() === "") {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    const result = await resetPassword(email);
    if (result.success) {
      Alert.alert("Success", "Password reset email has been sent.");
    } else {
      Alert.alert("Error", "Failed to send password reset email.");
    }
  };
  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
        <Image
          source={require("../assets/images/eas logo.png")}
          style={styles.logo}
        />
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!passwordVisible}
            onChangeText={setPassword}
            value={password}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={passwordVisible ? "eye" : "eye-off"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password Button */}
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}> New Member? </Text>
          <TouchableOpacity onPress={() => router.push("/screens/signup")}>
            <Text style={[styles.signUpText, styles.registerText]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading && (
        <View style={styles.loaderContainer}>
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: bounceAnim1 }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: bounceAnim2 }] }]}
          />
          <Animated.View
            style={[styles.dot, { transform: [{ translateY: bounceAnim3 }] }]}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: width * 0.05, // Responsive padding
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: height * 0.02,
  },
  welcomeText: {
    fontSize: width * 0.07,
    fontWeight: "bold",
    marginBottom: height * 0.03,
  },
  input: {
    height: height * 0.06,
    width: "100%",
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    backgroundColor: "#ffffff",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: height * 0.02,
  },
  eyeIcon: {
    position: "absolute",
    right: width * 0.02,
    bottom: 20,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: height * 0.03,
  },
  button: {
    backgroundColor: "#FF8852",
    borderRadius: 8,
    paddingVertical: height * 0.02,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  forgotPasswordText: {
    color: "#FF8852",
    fontSize: width * 0.04,
    marginTop: height * 0.02,
    textAlign: "center",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    color: "#FF8852",
    fontSize: width * 0.04,
  },
  registerText: {
    fontWeight: "bold",
  },
  loaderContainer: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: width * 0.025,
    height: width * 0.025,
    borderRadius: width * 0.0125,
    backgroundColor: "#FF8852",
    marginHorizontal: width * 0.01,
  },
});

export default LoginScreen;
