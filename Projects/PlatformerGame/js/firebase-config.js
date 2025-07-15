// firebase-config.js
// Initialize Firebase (add this to your HTML before other scripts)
const firebaseConfig = {
  apiKey: "AIzaSyBd9oEmkAgT7pFJ9hGsKkVPAaQpPTxCiQs",
  authDomain: "platformer1-71780.firebaseapp.com",
  projectId: "platformer1-71780",
  storageBucket: "platformer1-71780.firebasestorage.app",
  messagingSenderId: "347667129808",
  appId: "1:347667129808:web:17d7c3560c7559d8d9c5d5",
  measurementId: "G-ZVQ7C2TL27"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Make Firebase services available globally
window.db = db;
window.auth = auth;
window.firebase = firebase;

// Enable offline persistence for Firestore
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support offline persistence');
    }
  });

// Log successful initialization
console.log('Firebase initialized with project:', firebaseConfig.projectId);