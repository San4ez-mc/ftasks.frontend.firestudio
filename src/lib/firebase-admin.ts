
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
      // Explicitly use the FIREBASE_CONFIG env var provided by App Hosting
      const firebaseConfigEnv = process.env.FIREBASE_CONFIG;
      if (!firebaseConfigEnv) {
          await sendDebugMessage("CRITICAL ERROR: FIREBASE_CONFIG environment variable is not set.");
          throw new Error("FIREBASE_CONFIG environment variable is not set.");
      }
      
      const firebaseConfig = JSON.parse(firebaseConfigEnv);
      await sendDebugMessage(`initializeDb: Using FIREBASE_CONFIG: ${JSON.stringify(firebaseConfig)}`);
      
      // Initialize with the explicit config
      app = initializeApp(firebaseConfig);
      await sendDebugMessage('initializeDb: initializeApp() completed with explicit config.');

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

export function getDb(): Promise<Firestore> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
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
