// Firebase Admin SDK
const admin = require("firebase-admin");
// Config từ biến môi trường
const {
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

// Khởi tạo Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDB = admin.firestore(); // Firestore Admin
// Export cho controller sử dụng
module.exports = {
  admin,
  adminDB, // Firestore admin, dùng luôn
};
