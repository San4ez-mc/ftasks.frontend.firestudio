
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Підключаємось до конкретної бази даних 'tasktrakerdb'
export const firestore = getFirestore(admin.app(), 'tasktrakerdb');
