// Firebase Configuration
// Portal Print Cards - Arqueta Folding
// Note: Firebase compat libraries are loaded via <script> tags in HTML

const firebaseConfig = {
  apiKey: "AIzaSyAdoeWK1rXP0VQ8MMNY2FI4HPeWcWWvxWc",
  authDomain: "portal-print-cards.firebaseapp.com",
  projectId: "portal-print-cards",
  storageBucket: "portal-print-cards.firebasestorage.app",
  messagingSenderId: "652587578978",
  appId: "1:652587578978:web:ae3b3409677e35a81b033b",
  measurementId: "G-SLMJWJ2WBX"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  PRINT_CARDS: 'printCards',
  CLIENTS: 'clients',
  SIGNATURES: 'signatures',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOG: 'auditLog'
};

// Storage paths
const STORAGE_PATHS = {
  PRINT_CARDS: 'printcards',
  SIGNATURES: 'signatures'
};

// Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not available in this browser');
  }
});

console.log('Firebase initialized successfully');
console.log('Project:', firebaseConfig.projectId);// Firebase Configuration
// Portal Print Cards - Arqueta Folding

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';

const firebaseConfig = {
  apiKey: "AIzaSyAdoeWK1rXP0VQ8MMNY2FI4HPeWcWWvxWc",
  authDomain: "portal-print-cards.firebaseapp.com",
  projectId: "portal-print-cards",
  storageBucket: "portal-print-cards.firebasestorage.app",
  messagingSenderId: "652587578978",
  appId: "1:652587578978:web:ae3b3409677e35a81b033b",
  measurementId: "G-SLMJWJ2WBX"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not available in this browser');
  }
});

console.log('Firebase initialized successfully');
console.log('Project:', firebaseConfig.projectId);
