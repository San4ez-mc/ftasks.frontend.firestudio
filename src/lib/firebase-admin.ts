
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firestore: Firestore;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  // Use the default database instance
  firestore = getFirestore();
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed. This will cause Firestore operations to fail.', error);
  // firestore will be undefined, and service functions will guard against this.
}

export { firestore };
