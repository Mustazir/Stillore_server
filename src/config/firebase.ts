import admin from 'firebase-admin';
// @ts-ignore
import serviceAccount from './serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  console.log('✅ Firebase Admin SDK initialized');
}

export default admin;