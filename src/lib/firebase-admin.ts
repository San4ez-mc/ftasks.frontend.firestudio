import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let dbInstance: Firestore | null = null;

/**
 * A singleton function to get the Firestore instance.
 * It initializes the Firebase Admin SDK only once, on the first call.
 * This is a more robust pattern for serverless environments.
 */
export function getDb(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }
  
  let app: App;
  if (getApps().length === 0) {
    try {
        app = initializeApp();
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
        throw new Error('Could not initialize Firebase Admin SDK.');
    }
  } else {
    app = getApp();
  }

  dbInstance = getFirestore(app);
  return dbInstance;
}
