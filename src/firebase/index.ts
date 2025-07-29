'use client'
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, ref  } from "firebase/storage"
import { getAuth, signInAnonymously } from "firebase/auth";
// import { getPerformance } from "firebase/performance";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxCQEd3s9gO5aPrjA5ShyhgCEN7mQi1a8",
  authDomain: "torazon.firebaseapp.com",
  projectId: "torazon",
  storageBucket: "torazon.firebasestorage.app",
  messagingSenderId: "367747729148",
  appId: "1:367747729148:web:6c8074e0177752c4857979",
  measurementId: "G-2LRLER0ZXR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const storage = getStorage(app);
const auth = getAuth(app);

const storageFeedRef = ref(storage, "feed")

export const signInAnon = () => signInAnonymously(auth);

export { app, auth, storage, storageFeedRef }