// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "sahayakpk",
  "appId": "1:404225979493:web:07e7d38d513e3a7701028c",
  "storageBucket": "sahayakpk.firebasestorage.app",
  "apiKey": "AIzaSyCJFMkq1OrBkNwWSZf2UUX6V-Sq4jJVJew",
  "authDomain": "sahayakpk.firebaseapp.com",
  "messagingSenderId": "404225979493"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
