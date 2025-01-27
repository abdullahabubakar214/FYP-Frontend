// firebase.js

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { sendPasswordResetEmail } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD4ihJh92VZU3ldHrGHmf5COFC-jSJKVRI",
  authDomain: "first-project-3c315.firebaseapp.com",
  projectId: "first-project-3c315",
  storageBucket: "first-project-3c315.appspot.com",
  messagingSenderId: "931372462108",
  appId: "1:931372462108:web:a91b2dd738bd3fd1b3efd9",
  measurementId: "G-QHYNNRW2MN",
  databaseURL: "https://first-project-3c315-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase app if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Authentication functions

// Sign In Function
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Force refresh token after successful login
    const token = await user.getIdToken(true);
    
    // Store the new token in AsyncStorage
    await ReactNativeAsyncStorage.setItem('authToken', token);
    
    console.log('Firebase Token:', token); // Log the token to verify it's being retrieved

    // Return user UID and token
    return { success: true, uid: user.uid, token };
  } catch (error) {
    console.error('Error logging in:', error.code, error.message);
    return { success: false }; // Return false if sign-in fails
  }
};

// Sign Up Function
export const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User signed up successfully.');
    return { success: true, uid: user.uid }; // Return user UID on success
  } catch (error) {
    console.error('Error signing up:', error.code, error.message);
    return { success: false }; // Return false if sign-up fails
  } 
};

// Function to get the current user's token
export const getToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null; // Return null if no user is logged in
};

// Function to refresh the current user's token
export const refreshToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken(true); // Force refresh the token
  }
  return null; // Return null if no user is logged in
};

// Function to get the current user's ID
export const getCurrentUserId = () => {
  const user = auth.currentUser;
  return user ? user.uid : null; // Return user UID or null if not logged in
};

// Function to monitor authentication state with email verification check
export const monitorAuthState = (callback) => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Reload user to get the latest email verification status
      await user.reload();
      const isVerified = user.emailVerified;

      const token = await user.getIdToken();
      await ReactNativeAsyncStorage.setItem('authToken', token);

      console.log('User is signed in:', user.uid, 'Verified:', isVerified);
      
      // Only call callback if the user is verified
      if (isVerified) {
        callback({ loggedIn: true });
      } else {
        callback({ loggedIn: false, needsVerification: true });
      }
    } else {
      // User is signed out
      console.log('No user is signed in.');
      callback({ loggedIn: false });
    }
  });

  // Return the unsubscribe function
  return unsubscribe;
};

// Function for resetting password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully.');
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Exporting everything from a single file
export { auth, db, app };