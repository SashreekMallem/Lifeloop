
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// ==========================================================================================
// Your web app's Firebase configuration
// THIS CONFIGURATION WAS PROVIDED BY THE USER.
// If "auth/configuration-not-found" errors persist,
// please double-check these values against your Firebase project settings.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "life-os-yke0o.firebaseapp.com",
  projectId: "life-os-yke0o",
  storageBucket: "life-os-yke0o.appspot.com", // Corrected to .appspot.com as typical
  messagingSenderId: "223755691371",
  appId: "1:223755691371:web:f22a2841224236fdf8582e"
  // measurementId: "YOUR_MEASUREMENT_ID_FROM_FIREBASE_CONSOLE" // Optional
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);

export { app, auth };
