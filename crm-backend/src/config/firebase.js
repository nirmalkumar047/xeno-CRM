const admin = require("firebase-admin");

function initFirebase() {
  if (!admin.apps.length) {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Option A: load from JSON file directly (recommended, avoids \n escaping issues)
      credential = admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    } else {
      // Option B: individual env vars
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
      };
      credential = admin.credential.cert(serviceAccount);
    }

    admin.initializeApp({ credential });
  }
  return admin;
}

initFirebase();

let db;
function getFirestore() {
  if (!db) {
    db = admin.firestore();
  }
  return db;
}

module.exports = { getFirestore, admin };