
'use server';

import * as admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { sendDebugMessage } from '@/app/actions';

let dbInstance: Firestore | null = null;

/**
 * Initializes the Firebase Admin SDK if it hasn't been already.
 * This simplified version avoids complex promise-based singletons and uses the standard
 * `admin.apps.length` check, which is more robust against bundler issues.
 */
function initializeAdmin() {
    if (admin.apps.length === 0) {
        try {
            // When running in a Google Cloud environment like App Hosting,
            // initializeApp() automatically discovers the service account credentials.
            admin.initializeApp();
            sendDebugMessage('Firebase Admin SDK initialized successfully.');
        } catch (error: any) {
            const errorMessage = `Firebase Admin SDK initialization failed: ${error.message}`;
            console.error(errorMessage, error);
            sendDebugMessage(`CRITICAL ERROR: ${errorMessage}`);
            // We throw the error to ensure that any function trying to use the DB fails clearly.
            throw new Error(errorMessage);
        }
    }
}

/**
 * Provides a singleton instance of the Firestore database.
 * It ensures that the Admin SDK is initialized before returning the DB instance.
 * @returns A promise that resolves to the Firestore instance.
 */
export async function getDb(): Promise<Firestore> {
    if (dbInstance) {
        return dbInstance;
    }
    
    initializeAdmin();
    // getFirestore() can be called multiple times, it will return the same instance.
    dbInstance = getFirestore();
    
    return dbInstance;
}
