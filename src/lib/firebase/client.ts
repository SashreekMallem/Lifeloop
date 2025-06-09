// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
const firebaseConfig = {
  // This is for demonstration purposes only. In a production app,
  // you should use environment variables for your API key.
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "life-os-yke0o.firebaseapp.com",
  projectId: "life-os-yke0o",
  storageBucket: "life-os-yke0o.firebasestorage.app",
  messagingSenderId: "223755691371",
  appId: "1:223755691371:web:f22a2841224236fdf8582e"
};

// Initialize Firebase
// Check if Firebase has already been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
