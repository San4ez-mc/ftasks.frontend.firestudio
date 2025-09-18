import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { sendDebugMessage } from '@/app/actions';

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
  
  try {
    sendDebugMessage('getDb: Attempting to get Firebase app.');
    let app: App;
    if (getApps().length === 0) {
      sendDebugMessage('getDb: No existing apps found. Initializing new Firebase Admin app...');
      app = initializeApp();
      sendDebugMessage('getDb: Firebase Admin SDK initialized successfully.');
    } else {
      app = getApp();
      sendDebugMessage('getDb: Existing Firebase app found.');
    }

    sendDebugMessage('getDb: Getting Firestore instance.');
    dbInstance = getFirestore(app);
    sendDebugMessage('getDb: Firestore instance obtained.');
    return dbInstance;
  } catch (error) {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error);
    // Send the error message via Telegram and then re-throw to stop execution.
    // We don't await this because if it fails, we don't want to crash the crash handler.
    sendDebugMessage(`CRITICAL ERROR in getDb(): ${errorMessage}`);
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
    throw new Error('Could not initialize Firebase Admin SDK.');
  }
}
