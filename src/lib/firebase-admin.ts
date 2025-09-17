import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

/**
 * A singleton function to get the Firestore instance.
 * It initializes the Firebase Admin SDK only once, on the first call.
 * This is a more robust pattern for serverless environments.
 */
export function getDb(): Firestore {
  if (db) {
    return db;
  }

  if (admin.apps.length === 0) {
    try {
      // In a deployed Google Cloud environment (like App Hosting),
      // this initializes with default credentials.
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
      // Throw the error to prevent the app from continuing in a broken state.
      throw new Error('Could not initialize Firebase Admin SDK.');
    }
  }
  
  db = getFirestore();
  return db;
}
