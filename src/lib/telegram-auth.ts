
import jwt from 'jsonwebtoken';
import { db, users, companies, employees as employeeLinks } from '@/lib/db'; // Mock DB
import { firestore } from './firebase-admin';
import type { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;
const GROUP_LINK_CODE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export async function findUserByTelegramId(telegramUserId: string): Promise<(User & { id: string }) | null> {
    const usersCollection = firestore.collection('users');
    const userQuery = await usersCollection.where('telegramUserId', '==', telegramUserId).limit(1).get();
    if (userQuery.empty) {
        return null;
    }
    const userDoc = userQuery.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as (User & { id: string });
}

export async function handleTelegramLogin(telegramUser: TelegramUser, rememberMe: boolean): Promise<{ tempToken?: string; error?: string; details?: string }> {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined.");
    return { error: 'Server configuration error' };
  }
  
  const { id: telegramUserId, first_name, last_name, username, photo_url } = telegramUser;

  if (!telegramUserId) {
    return { error: 'Telegram user ID is required' };
  }

  try {
    const usersCollection = firestore.collection('users');
    let userQuery = await usersCollection.where('telegramUserId', '==', telegramUserId.toString()).limit(1).get();
    let user: any;
    let details: string;

    if (userQuery.empty) {
      const newUserRef = usersCollection.doc();
      user = {
        id: newUserRef.id,
        telegramUserId: telegramUserId.toString(),
        firstName: first_name,
        lastName: last_name || '',
        telegramUsername: username || '',
        photo_url: photo_url || '',
      };
      await newUserRef.set(user);
      details = `New user ${first_name} created with ID ${user.id}.`;
    } else {
      const userDoc = userQuery.docs[0];
      user = { id: userDoc.id, ...userDoc.data() };
      details = `Existing user ${first_name} found with ID ${user.id}.`;
    }

    const tempToken = jwt.sign({ userId: user.id, rememberMe }, JWT_SECRET, { expiresIn: '5m' });
    
    return { tempToken, details };

  } catch (error) {
      console.error('Error in handleTelegramLogin:', error);
      return { error: 'An internal error occurred during login.' };
  }
}

/**
 * Generates and stores a short-lived code for linking a Telegram group.
 */
export async function generateGroupLinkCode(groupId: string, groupTitle: string): Promise<{ code?: string; error?: string }> {
    try {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + GROUP_LINK_CODE_EXPIRATION);

        await firestore.collection('groupLinkCodes').doc(code).set({
            groupId,
            groupTitle,
            expiresAt,
        });

        return { code };
    } catch (error) {
        console.error("Error generating group link code:", error);
        return { error: 'Could not generate a link code.' };
    }
}
