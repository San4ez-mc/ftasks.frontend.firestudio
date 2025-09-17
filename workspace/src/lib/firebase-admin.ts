
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firestore: Firestore;

// This pattern prevents re-initialization in hot-reload environments
if (!admin.apps.length) {
  admin.initializeApp();
}

firestore = getFirestore();

export { firestore };
