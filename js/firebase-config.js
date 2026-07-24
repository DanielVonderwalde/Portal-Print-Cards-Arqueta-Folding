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
  AUDIT_LOG: 'auditLog',
  SUBMISSIONS: 'submissions',
  SETTINGS: 'settings',
  PROJECTS: 'projects'
};

// Storage paths
const STORAGE_PATHS = {
  PRINT_CARDS: 'printcards',
  SIGNATURES: 'signatures',
  SUBMISSIONS: 'submissions'
};

// Web3Forms access key for sending emails to the admin recipients.
// Public key (safe in client code), tied to daniel.vonderwalde@arquetaf.com.
const WEB3FORMS_KEY = '7464ff36-bd28-429c-b872-698923ca23a5';

// Default email that receives client document submissions (editable in-app).
const DEFAULT_NOTIFY_EMAIL = 'daniel.vonderwalde@arquetaf.com';

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
