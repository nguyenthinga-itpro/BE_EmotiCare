// ==============================
// Firebase Client SDK
// ==============================
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

// ==============================
// Firebase Admin SDK
// ==============================
const admin = require("firebase-admin");

// ==============================
// Config từ biến môi trường
// ==============================
const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_TYPE,
  FIREBASE_PROJECT_IDID,
  FIREBASE_PRIVATE_KEY_IDID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID,
  FIREBASE_AUTH_URI,
  FIREBASE_TOKEN_ID,
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  FIREBASE_CLIENT_X509_CERT_URL,
  FIREBASE_UNIVERSE_DOMAIN,
} = process.env;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

const serviceAccount = {
  type: FIREBASE_TYPE,
  projectId: FIREBASE_PROJECT_IDID,
  privateKeyId: FIREBASE_PRIVATE_KEY_IDID,
  privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  clientEmail: FIREBASE_CLIENT_EMAIL,
  clientId: FIREBASE_CLIENT_ID,
  authUri: FIREBASE_AUTH_URI,
  tokenUri: FIREBASE_TOKEN_ID,
  authProviderX509CertUrl: FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  clientX509CertUrl: FIREBASE_CLIENT_X509_CERT_URL,
  universeDomain: FIREBASE_UNIVERSE_DOMAIN,
};

// ==============================
// Khởi tạo Firebase Client
// ==============================
let clientDB = null;

const initializeFirebaseApp = async () => {
  try {
    const app = initializeApp(firebaseConfig);
    clientDB = getFirestore(app);
    console.log("🔥 Firebase Client initialized successfully!");

    // Thử đọc collection test_connection để kiểm tra Firestore client
    const snapshot = await getDocs(collection(clientDB, "test_connection"));
    console.log("✅ Firestore Client connected! Docs count:", snapshot.size);
  } catch (error) {
    console.error("❌ Firebase Client initialization failed:", error);
  }
};

// ==============================
// Khởi tạo Firebase Admin
// ==============================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase Admin initialized successfully!");
}

const adminDB = admin.firestore();

// ==============================
// Export cho controller sử dụng
// ==============================
module.exports = {
  initializeFirebaseApp,
  getDB: () => clientDB, // Firestore client
  admin,
  adminDB, // Firestore admin
};
