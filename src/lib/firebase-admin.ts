
import * as admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firestore: Firestore;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  // Підключаємось до конкретної бази даних 'tasktrakerdb'
  firestore = getFirestore(admin.app(), 'tasktrakerdb');
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed. This will cause Firestore operations to fail.', error);
  // firestore залишається невизначеним, і сервісні функції перевірятимуть це.
}

export { firestore };
