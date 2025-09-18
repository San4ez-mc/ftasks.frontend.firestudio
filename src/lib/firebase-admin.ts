'use server';

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { sendDebugMessage } from '@/app/actions';

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    sendDebugMessage('getDb sync: Attempting to get Firebase app.');
    let app: App;
    if (getApps().length === 0) {
      sendDebugMessage('getDb sync: No existing apps found. Initializing new Firebase Admin app...');
      
      // Explicitly use the FIREBASE_CONFIG env var provided by App Hosting
      const firebaseConfigEnv = process.env.FIREBASE_CONFIG;
      if (!firebaseConfigEnv) {
          sendDebugMessage("CRITICAL ERROR: FIREBASE_CONFIG environment variable is not set.");
          throw new Error("FIREBASE_CONFIG environment variable is not set.");
      }
      
      const firebaseConfig = JSON.parse(firebaseConfigEnv);
      
      app = initializeApp();
      sendDebugMessage('getDb sync: Firebase Admin SDK initialized successfully.');
    } else {
      app = getApp();
      sendDebugMessage('getDb sync: Existing Firebase app found.');
    }

    sendDebugMessage('getDb sync: Getting Firestore instance.');
    dbInstance = getFirestore(app);
    sendDebugMessage('getDb sync: Firestore instance obtained.');
    return dbInstance;
  } catch (error) {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error);
    // This is synchronous, so we can't await. This is a fire-and-forget log attempt.
    sendDebugMessage(`CRITICAL ERROR in getDb() sync: ${errorMessage}`);
    console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
    throw new Error('Could not initialize Firebase Admin SDK.');
  }
}
