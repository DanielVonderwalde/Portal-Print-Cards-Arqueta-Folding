// Firebase Configuration
// Portal Print Cards - Arqueta Folding
// Note: Firebase compat libraries are loaded via <script> tags in HTML

const firebaseConfig = {
  apiKey: "AIzaSyAdoeWK1rXP0VQ8MMNY2FI4HPeWcWvxWc",
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

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  PRINT_CARDS: 'printCards',
  CLIENTS: 'clients',
  SIGNATURES: 'signatures',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOG: 'auditLog'
};

// Status constants
const PRINT_CARD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION: 'revision'
};

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client'
};
