'use server';

import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let dbInstance: Firestore | null = null;
let initPromise: Promise<Firestore> | null = null;

async function initializeDb(): Promise<Firestore> {
  try {
    let app: App;
    if (getApps().length === 0) {
      app = initializeApp();
    } else {
      app = getApp();
    }
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (error) {
    console.error('CRITICAL ERROR: Firebase Admin SDK initialization failed.', error);
    // Re-throw the error to ensure the caller knows initialization failed.
    throw new Error('Could not initialize Firebase Admin SDK.');
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
