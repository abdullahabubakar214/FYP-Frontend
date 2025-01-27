// Index.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { monitorAuthState } from "./firebase/firebaseauth";
import * as Notifications from "expo-notifications";
import ProfileModal, { registerBackgroundTask } from "./screens/ProfileScreen";

const gradientColors = [
  ["#FF8852", "#FF6F61"],
  ["#FFB74D", "#64B5F6"],
  ["#81C784", "#FF6F61"],
];

const Index = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [buttonScale] = useState(new Animated.Value(1));
  const [gradientAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    registerBackgroundTask();
    const unsubscribe = monitorAuthState((authState) => {
      setLoading(false);
      if (authState.loggedIn) {
        router.replace("/screens/home");
      } else if (authState.needsVerification) {
        router.replace("/verification/EmailVerification");
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const notificationBody = notification.request.content.body;
        if (
          notificationBody.includes("It's an Emergency!") &&
          notificationBody.includes("SOS help is initiated")
        ) {
          notification.request.content.sound = "emergency_sound";
        } else {
          notification.request.content.sound = "default";
        }
      }
    );

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      unsubscribe();
      Notifications.removeNotificationSubscription(notificationListener);
    };
  }, [router, fadeAnim, buttonScale, gradientAnim]);

  return (
    <Animated.View style={styles.container}>
      <LinearGradient
        colors={gradientColors[0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [
                {
                  scale: gradientAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.3],
                  }),
                },
              ],
            },
          ]}
        />
      ) : (
        <Animated.View style={{ ...styles.content, opacity: fadeAnim }}>
          <Text style={styles.title}>Welcome to EAS!</Text>
          <Text style={styles.subtitle}>
            Get started by logging in or signing up.
          </Text>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/screens/login")}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 136, 82, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginVertical: 20,
    color: "#ffffff",
  },
  button: {
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF8852",
  },
});

export default Index;
