
'use server';

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { sendDebugMessage } from '@/app/actions';

let dbInstance: Firestore | null = null;
let initPromise: Promise<Firestore> | null = null;

async function initializeDb(): Promise<Firestore> {
  try {
    await sendDebugMessage('initializeDb: Starting Firebase Admin SDK initialization...');
    
    let app: App;
    if (getApps().length === 0) {
      await sendDebugMessage('initializeDb: No existing apps. Calling initializeApp()...');
      app = initializeApp();
      await sendDebugMessage('initializeDb: initializeApp() completed.');
    } else {
      app = getApp();
      await sendDebugMessage('initializeDb: Using existing app.');
    }

    const db = getFirestore(app);
    await sendDebugMessage('initializeDb: getFirestore() completed. Initialization successful.');
    dbInstance = db;
    return db;
  } catch (error) {
    const errorMessage = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error);
    await sendDebugMessage(`CRITICAL ERROR during initializeDb: ${errorMessage}`);
    console.error('CRITICAL ERROR during initializeDb:', error);
    throw error;
  }
}

export async function getDb(): Promise<Firestore> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(async () => {
      initPromise = null; // Reset for next attempt
      await sendDebugMessage('CRITICAL ERROR: Firebase Admin SDK initialization timed out after 10 seconds.');
      reject(new Error('Firebase Admin SDK initialization timed out after 10 seconds.'));
    }, 10000);

    initializeDb()
      .then(db => {
        clearTimeout(timeout);
        initPromise = null; // Clear the promise on success
        resolve(db);
      })
      .catch(err => {
        clearTimeout(timeout);
        initPromise = null; // Reset for next attempt
        reject(err);
      });
  });

  return initPromise;
}
