// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBB0XTePRfk_UzMvTRD-KA81HHPJk8PF-s",
  authDomain: "otpsystem-180a9.firebaseapp.com",
  projectId: "otpsystem-180a9",
  storageBucket: "otpsystem-180a9.firebasestorage.app",
  messagingSenderId: "1061619514294",
  appId: "1:1061619514294:web:8af8f5381965a7be415f17",
  measurementId: "G-X7Q32C9JWY"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
