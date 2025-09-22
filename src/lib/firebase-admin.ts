
'use server';

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { sendDebugMessage } from '@/app/actions';

let dbInstance: Firestore | null = null;
let initPromise: Promise<Firestore> | null = null;

async function initializeDb(): Promise<Firestore> {
  await sendDebugMessage(`initializeDb: Starting. Number of existing apps: ${getApps().length}`);
  try {
    let app: App;
    if (getApps().length === 0) {
      await sendDebugMessage('initializeDb: No existing apps. Calling initializeApp()...');
      app = initializeApp();
      await sendDebugMessage('initializeDb: initializeApp() completed.');
    } else {
      await sendDebugMessage('initializeDb: App already exists. Calling getApp()...');
      app = getApp();
      await sendDebugMessage('initializeDb: getApp() completed.');
    }
    
    await sendDebugMessage('initializeDb: Calling getFirestore()...');
    dbInstance = getFirestore(app);
    await sendDebugMessage('initializeDb: getFirestore() completed. DB instance is ready.');
    
    return dbInstance;
  } catch (error: any) {
    const errorMessage = error.message ? `${error.name}: ${error.message}` : String(error);
    await sendDebugMessage(`CRITICAL ERROR in initializeDb: ${errorMessage}`);
    console.error('CRITICAL ERROR: Firebase Admin SDK initialization failed.', error);
    throw new Error(`Could not initialize Firebase Admin SDK. Details: ${errorMessage}`);
  }
}

export async function getDb(): Promise<Firestore> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = initializeDb().catch(err => {
    initPromise = null; // Reset promise on failure to allow retries
    throw err;
  });

  return initPromise;
}
