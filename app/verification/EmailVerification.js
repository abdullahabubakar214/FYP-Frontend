// EmailVerification.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { useRouter } from "expo-router";

const EmailVerification = () => {
  const [emailVerified, setEmailVerified] = useState(false);
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    const checkEmailVerification = async () => {
      await auth.currentUser.reload();
      setEmailVerified(auth.currentUser.emailVerified);
    };

    checkEmailVerification();
  }, []);

  const resendEmailVerification = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert("Success", "Verification email has been resent.");
    } catch (error) {
      Alert.alert("Error", "Failed to resend verification email.");
      console.error("Email verification error: ", error);
    }
  };

  const handleCheckVerification = async () => {
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      setEmailVerified(true);
      Alert.alert("Success", "Email verified successfully!");
      router.push("/screens/login");
    } else {
      Alert.alert("Error", "Email not verified yet. Please check your inbox.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Verification</Text>
      <Text>Please check your email and verify your email address.</Text>
      <TouchableOpacity style={styles.button} onPress={resendEmailVerification}>
        <Text style={styles.buttonText}>Resend Verification Email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleCheckVerification}>
        <Text style={styles.buttonText}>Check Verification Status</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF8852",
    padding: 10,
    borderRadius: 5,
    width: "80%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default EmailVerification;
