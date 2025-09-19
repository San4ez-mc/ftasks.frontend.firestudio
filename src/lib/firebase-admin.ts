'use server';

import type { Firestore } from 'firebase-admin/firestore';

/**
 * Temporarily disable the real initialization to prevent server crash.
 * This will allow us to deploy and test the rest of the app.
 * Any part of the app that relies on this will gracefully fail instead of
 * crashing the entire server process.
 */
export async function getDb(): Promise<Firestore> {
  throw new Error(
    'DB_DISABLED_FOR_DEBUGGING: The Admin SDK initialization is currently disabled to prevent a server crash. This is a temporary measure to isolate the issue.'
  );
}
