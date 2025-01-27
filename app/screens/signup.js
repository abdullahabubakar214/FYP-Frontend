import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseauth";
import { useRouter } from "expo-router";
import PhoneInput from "react-native-phone-number-input"; // Combines flag and country code selection
import Icon from "react-native-vector-icons/Ionicons"; // For the eye icon

const { width, height } = Dimensions.get("window");

const SignupScreen = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("PK"); // Initial country code
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim1 = useRef(new Animated.Value(0)).current;
  const bounceAnim2 = useRef(new Animated.Value(0)).current;
  const bounceAnim3 = useRef(new Animated.Value(0)).current;
  const phoneInput = useRef(null);
  const router = useRouter();

  const bounceAnimation = (animatedValue) => {
    Animated.loop(
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
    ).start();
  };

  useEffect(() => {
    if (loading) {
      bounceAnimation(bounceAnim1);
      setTimeout(() => bounceAnimation(bounceAnim2), 100);
      setTimeout(() => bounceAnimation(bounceAnim3), 200);
    }
  }, [loading]);

  const checkPasswordStrength = (password) => {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@$!%*?&#]/.test(password);

    const strength = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;

    // Set password strength
    if (strength <= 2) {
      setPasswordStrength("Weak");
    } else if (strength === 3 || strength === 4) {
      setPasswordStrength("Medium");
    } else if (strength === 5) {
      setPasswordStrength("Strong");
    } else {
      setPasswordStrength("");
    }

    // Show password hints while typing
    setShowPasswordHints(true);
  };

  const handleSignUp = async () => {
    const auth = getAuth();
  
    // Input validation
    if (fullName.trim() === "") {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }
    if (email.trim() === "") {
      Alert.alert("Error", "Please enter your email.");
      return;
    }
    if (!phoneInput.current?.isValidNumber(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }
    if (passwordStrength !== "Strong") {
      Alert.alert("Error", "Password does not meet the required criteria.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
  
    setLoading(true);
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Send email verification and immediately redirect to verification screen
      await sendEmailVerification(user);
      Alert.alert('Success', 'A verification email has been sent. Please verify your email before logging in.');
  
      // Store user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        phoneNumber,
        createdAt: new Date(),
        emailVerified: false,
      });
  
      // Redirect to email verification screen immediately
      router.replace("/verification/EmailVerification"); // Use `replace` instead of `push`
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          <Image
            source={require("../assets/images/eas logo.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Create Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            onChangeText={setFullName}
            value={fullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {/* Phone input is still here but only used for validation, not verification */}
          <PhoneInput
            ref={phoneInput}
            defaultValue={phoneNumber}
            defaultCode={countryCode}
            layout="first"
            onChangeCountry={(country) => setCountryCode(country.cca2)}
            onChangeFormattedText={(text) => setPhoneNumber(text)}
            containerStyle={styles.phoneInput}
            textContainerStyle={styles.phoneTextInput}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              secureTextEntry={!passwordVisible}
              onChangeText={(text) => {
                setPassword(text);
                checkPasswordStrength(text);
              }}
              value={password}
              onBlur={() => setShowPasswordHints(false)}
              onFocus={() => setShowPasswordHints(true)}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={styles.eyeIcon}
            >
              <Icon
                name={passwordVisible ? "eye-off" : "eye"}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          {/* Password strength meter */}
          {showPasswordHints && password !== "" && (
            <View style={styles.passwordStrengthContainer}>
              <View
                style={[
                  styles.strengthBar,
                  {
                    backgroundColor:
                      passwordStrength === "Weak"
                        ? "red"
                        : passwordStrength === "Medium"
                        ? "orange"
                        : "green",
                  },
                ]}
              />
              <Text style={styles.passwordStrengthText}>
                {passwordStrength === "Weak"
                  ? "Password is too weak"
                  : passwordStrength === "Medium"
                  ? "Password strength is medium"
                  : "Password is strong"}
              </Text>
            </View>
          )}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              secureTextEntry={!confirmPasswordVisible}
              onChangeText={setConfirmPassword}
              value={confirmPassword}
            />
            <TouchableOpacity
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              style={styles.eyeIcon}
            >
              <Icon
                name={confirmPasswordVisible ? "eye-off" : "eye"}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loginContainer}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/screens/login")}>
              <Text style={[styles.loginText, styles.registerText]}>Log In</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.05,
    backgroundColor: "#fff",
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: height * 0.03,
  },
  title: {
    fontSize: width * 0.06,
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
  phoneInput: {
    width: "100%",
    marginBottom: height * 0.02,
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#f8f9fa", // Light gray background
    shadowColor: "#000", // Adding shadow for depth
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
  },
  
  phoneTextInput: {
    backgroundColor: "#ffffff",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: width * 0.04,
    height: height * 0.06, // Consistent height
    fontSize: width * 0.04, // Slightly larger text
    color: "#333", // Darker text for better readability
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: height * 0.02,
  },
  passwordInput: {
    flex: 1,
    height: height * 0.06,
    borderColor: "#ced4da",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: width * 0.04,
    backgroundColor: "#ffffff",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
  },
  passwordStrengthContainer: {
    width: "100%",
    marginBottom: height * 0.02,
    alignItems: "center",
  },
  strengthBar: {
    width: "80%",
    height: 5,
    borderRadius: 5,
    marginVertical: 5,
  },
  passwordStrengthText: {
    fontSize: 12,
  },
  buttonContainer: {
    width: "100%",
    marginTop: height * 0.01,
  },
  button: {
    height: height * 0.07,
    backgroundColor: "#FF8852",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    width: "100%",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: width * 0.05,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.02,
  },
  loginText: {
    color: "#FF8852",
    marginLeft: width * 0.02,
    fontSize: width * 0.045,
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
    width: width * 0.03,
    height: width * 0.03,
    borderRadius: width * 0.015,
    backgroundColor: "#ff7f50",
    marginHorizontal: width * 0.015,
  },
});
export default SignupScreen;
