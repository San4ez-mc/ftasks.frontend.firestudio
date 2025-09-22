
'use server';

import { getDb } from '@/lib/firebase-admin';
import type { User } from '@/types/user';
import { createSession } from './firestore-service';
import { sendDebugMessage } from '@/app/actions';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export async function findUserByTelegramId(telegramUserId: string): Promise<(User & { id: string }) | null> {
    const db = await getDb();
    const usersCollection = db.collection('users');
    const userQuery = await usersCollection.where('telegramUserId', '==', telegramUserId).limit(1).get();
    if (userQuery.empty) {
        return null;
    }
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    if (userData.photo_url && !userData.avatar) {
        userData.avatar = userData.photo_url;
    }

    return { id: userDoc.id, ...userData } as (User & { id: string });
}

export async function handleTelegramLogin(telegramUser: TelegramUser, rememberMe: boolean): Promise<{ tempToken?: string; error?: string; details?: string }> {
  try {
    await sendDebugMessage(`handleTelegramLogin: Starting for TG user ${telegramUser.id}.`);
    
    const { id: telegramUserId, first_name, last_name, username, photo_url } = telegramUser;

    if (!telegramUserId) {
        throw new Error('Telegram user ID is required in the data from Telegram.');
    }

    await sendDebugMessage(`handleTelegramLogin: Attempting to get DB instance...`);
    const db = await getDb();
    await sendDebugMessage(`handleTelegramLogin: Successfully got DB instance. Querying for user...`);
    
    const usersCollection = db.collection('users');
    let userQuery;
    try {
        await sendDebugMessage(`Executing Firestore query: users.where('telegramUserId', '==', '${telegramUserId.toString()}').limit(1).get()`);
        userQuery = await usersCollection.where('telegramUserId', '==', telegramUserId.toString()).limit(1).get();
        await sendDebugMessage(`handleTelegramLogin: User query complete. Found ${userQuery.docs.length} users.`);
    } catch (queryError: any) {
        const errorMessage = `Firestore query failed: ${queryError.message}`;
        await sendDebugMessage(`CRITICAL ERROR during user query: ${errorMessage}`);
        console.error(errorMessage, queryError);
        return { error: errorMessage };
    }

    let user: any;
    let details: string;

    if (userQuery.empty) {
      await sendDebugMessage(`handleTelegramLogin: User not found. Creating new user for ${telegramUser.first_name}.`);
      const newUserRef = usersCollection.doc();
      const newUser = {
        telegramUserId: telegramUserId.toString(),
        firstName: first_name,
        lastName: last_name || '',
        telegramUsername: username || '',
        avatar: photo_url || `https://i.pravatar.cc/150?u=${username || telegramUserId}`,
        isAdmin: false,
      };
      await newUserRef.set(newUser);
      user = { id: newUserRef.id, ...newUser };
      details = `New user ${first_name} created with ID ${user.id}.`;
    } else {
      const userDoc = userQuery.docs[0];
      user = { id: userDoc.id, ...userDoc.data() };
      details = `Existing user ${first_name} found with ID ${user.id}.`;
      await sendDebugMessage(`handleTelegramLogin: Found existing user. Details: ${details}`);
    }
    
    await sendDebugMessage(`handleTelegramLogin: User processed. Creating temp session for user ID ${user.id}.`);
    const tempSessionExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const tempSession = await createSession({
        userId: user.id,
        rememberMe,
        expiresAt: tempSessionExpires.toISOString(),
        type: 'temp',
    });
    
    await sendDebugMessage(`handleTelegramLogin: Successfully created temp session ${tempSession.id}.`);
    return { tempToken: tempSession.id, details };

  } catch (error) {
      const errorMessage = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error);
      await sendDebugMessage(`CRITICAL ERROR in handleTelegramLogin: ${errorMessage}`);
      return { error: `Login Error: ${errorMessage}` };
  }
}

export async function generateGroupLinkCode(groupId: string, groupTitle: string): Promise<{ code?: string; error?: string }> {
    try {
        const db = await getDb();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.collection('groupLinkCodes').doc(code).set({
            tgGroupId: groupId,
            groupTitle,
            expiresAt,
        });

        return { code };
    } catch (error) {
        console.error("Error generating group link code:", error);
        return { error: 'Could not generate a link code.' };
    }
}
