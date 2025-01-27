import React, { useState, useRef } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Modal, Alert, TextInput, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { logout } from '../firebase/firebaseauth'; // Adjust path as necessary
import { getAuth, sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth'; // Include updatePassword
import { doc, updateDoc } from 'firebase/firestore'; // For Firestore if you're using it
import { db } from '../firebase/firebaseauth'; // Adjust your firebase configuration path
import PhoneInput from "react-native-phone-number-input"; // Phone input with validation
import { useRouter } from "expo-router"; // For navigation
import { signOut } from 'firebase/auth';

const SettingsScreen = () => {
  const [isNotificationEnabled, setNotificationEnabled] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);
  const [isPhoneModalVisible, setPhoneModalVisible] = useState(false);
  const [isEmailModalVisible, setEmailModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isPrivacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [countryCode, setCountryCode] = useState('US');
  const phoneInput = useRef(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();

  // Logout Function
  const handleLogout = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "No user is currently logged in.");
        return;
      }

      await signOut(auth);
      router.replace("/screens/login"); // Replace to prevent going back to the settings screen
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // Phone number change modal control
  const handleChangePhoneNumber = () => {
    setPhoneModalVisible(true);
  };

  const handleSavePhoneNumber = async () => {
    if (!phoneInput.current?.isValidNumber(newPhoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, { phoneNumber: newPhoneNumber });

      Alert.alert('Success', 'Phone number updated successfully');
      setPhoneModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update phone number');
    }
  };

  // Email change modal control
  const handleChangeEmail = () => {
    setEmailModalVisible(true);
  };

  // Re-authenticate and update email
  const handleVerifyEmail = async () => {
    if (!newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      await updateEmail(user, newEmail);
      await sendEmailVerification(user);

      Alert.alert('Verification email sent', 'A verification email has been sent to your new email. Please verify it.');

      router.push("/verification/EmailVerification");
      setEmailModalVisible(false);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        Alert.alert('Error', `Failed to send verification email: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password change modal control
  const handleChangePassword = () => {
    setPasswordModalVisible(true);
  };

  // Handle password change
  const handleSaveNewPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordValidation = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordValidation.test(newPassword)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and include at least 1 number and 1 special character.');
      return;
    }

    try {
      setIsLoading(true);

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password changed successfully! Please log in with your new password.');

      handleLogout(); 
      setPasswordModalVisible(false);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password. Please try again.');
      } else {
        Alert.alert('Error', `Failed to change password: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Privacy Policy Modal
  const handlePrivacyPolicy = () => {
    setPrivacyPolicyVisible(true);
  };

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Settings</Text>

        {/* Change Phone Number */}
        <TouchableOpacity style={styles.settingItem} onPress={handleChangePhoneNumber}>
          <Text style={styles.settingText}>Change Phone Number</Text>
          <Icon name="chevron-right" size={20} color="#FF8852" />
        </TouchableOpacity>

        {/* Change Password */}
        <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
          <Text style={styles.settingText}>Change Password</Text>
          <Icon name="chevron-right" size={20} color="#FF8852" />
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
          <Text style={styles.settingText}>Privacy Policy</Text>
          <Icon name="chevron-right" size={20} color="#FF8852" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Text style={styles.settingText}>Logout</Text>
          <Icon name="logout" size={20} color="#FF8852" />
        </TouchableOpacity>
      </View>

      {/* Modal for changing phone number */}
      <Modal
        transparent={true}
        visible={isPhoneModalVisible}
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Phone Number</Text>
            <PhoneInput
              ref={phoneInput}
              defaultValue={newPhoneNumber}
              defaultCode={countryCode}
              layout="first"
              onChangeCountry={(country) => setCountryCode(country.cca2)}
              onChangeFormattedText={(text) => setNewPhoneNumber(text)}
              containerStyle={styles.phoneInput}
              textContainerStyle={styles.phoneTextInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePhoneNumber}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPhoneModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for changing email */}
      <Modal
        transparent={true}
        visible={isEmailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Email</Text>
            <TextInput
              placeholder="Enter new email"
              value={newEmail}
              onChangeText={setNewEmail}
              style={styles.emailInput}
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              style={styles.emailInput}
              secureTextEntry={true}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleVerifyEmail} disabled={isLoading}>
                <Text style={styles.saveButtonText}>{isLoading ? 'Sending...' : 'Verify'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEmailModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for changing password */}
      <Modal
        transparent={true}
        visible={isPasswordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            {/* Current Password */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Enter current password"
                value={password}
                onChangeText={setPassword}
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? "visibility-off" : "visibility"} size={20} color="#FF8852" />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.passwordInput}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Icon name={showNewPassword ? "visibility-off" : "visibility"} size={20} color="#FF8852" />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.passwordInput}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon name={showConfirmPassword ? "visibility-off" : "visibility"} size={20} color="#FF8852" />
              </TouchableOpacity>
            </View>

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveNewPassword} disabled={isLoading}>
                <Text style={styles.saveButtonText}>{isLoading ? 'Changing...' : 'Change Password'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Privacy Policy */}
      <Modal
        transparent={true}
        visible={isPrivacyPolicyVisible}
        onRequestClose={() => setPrivacyPolicyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <ScrollView>
              <Text style={styles.policyText}>
                1. **Data Collection**: We collect personal information such as your name, email address, and phone number to provide you with timely emergency alerts and notifications. We also collect location data to ensure alerts are relevant to your current location.
                {'\n\n'}
                2. **Data Security**: We are committed to protecting your personal information. We implement reasonable security measures to safeguard your data from unauthorized access, loss, or misuse. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
              </Text>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={() => setPrivacyPolicyVisible(false)}>
                <Text style={styles.saveButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 20,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 25,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FF8852",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.41,
    elevation: 2,
  },
  settingText: {
    fontSize: 18,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  phoneInput: {
    width: '100%',
    marginBottom: 20,
  },
  phoneTextInput: {
    backgroundColor: '#ffffff',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#FF8852',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
  },
  emailInput: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  policyText: {
    marginBottom: 20,
    textAlign: 'left',
    color: '#333',
  },
});

export default SettingsScreen;
