
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firestore: Firestore;

// This pattern prevents re-initialization in hot-reload environments
if (!admin.apps.length) {
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // automatically provided by the Firebase App Hosting environment.
  admin.initializeApp();
}

firestore = getFirestore();

export { firestore };
