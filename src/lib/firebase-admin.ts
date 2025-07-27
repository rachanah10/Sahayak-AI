
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This function initializes Firebase Admin SDK.
// It checks if an app is already initialized to prevent errors.
export function initFirebaseAdmin() {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        // In a real application, you should throw an error here.
        // For the development environment, we can log a warning.
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized.');
        return;
    }
    
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
        });
    } catch (e) {
        console.error('Failed to initialize Firebase Admin SDK', e);
    }
  }
}
