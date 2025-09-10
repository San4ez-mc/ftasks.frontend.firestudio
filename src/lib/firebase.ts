
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
// This is public and safe to expose in your client-side code.
const firebaseConfig = {
  "projectId": "fineko-tasktracker",
  "appId": "1:1061908932290:web:733b6065bba8ac66eabd5b",
  "storageBucket": "fineko-tasktracker.firebasestorage.app",
  "apiKey": "AIzaSyDd29GCigbCCJAPuwCtCwEgjJPzMnYDNmI",
  "authDomain": "fineko-tasktracker.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1061908932290",
  "databaseURL": "https://fineko-tasktracker-tasktrakerdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
