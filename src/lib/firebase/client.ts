
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// ==========================================================================================
// IMPORTANT: Paste your web app's Firebase configuration directly from the Firebase Console
// (Project settings -> Your apps -> Web app -> SDK setup and configuration -> Config)
// into the firebaseConfig object below.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_FROM_FIREBASE_CONSOLE",
  authDomain: "YOUR_AUTH_DOMAIN_FROM_FIREBASE_CONSOLE",
  projectId: "YOUR_PROJECT_ID_FROM_FIREBASE_CONSOLE",
  storageBucket: "YOUR_STORAGE_BUCKET_FROM_FIREBASE_CONSOLE",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID_FROM_FIREBASE_CONSOLE",
  appId: "YOUR_APP_ID_FROM_FIREBASE_CONSOLE"
  // measurementId: "YOUR_MEASUREMENT_ID_FROM_FIREBASE_CONSOLE" // Optional, include if present
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
