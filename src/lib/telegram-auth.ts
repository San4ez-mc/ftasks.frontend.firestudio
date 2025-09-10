
import jwt from 'jsonwebtoken';
import { db, users } from '@/lib/db'; // Mock DB

const JWT_SECRET = process.env.JWT_SECRET;

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
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
    // --- Database Logic (Mocked) ---
    let user = users.find(u => u.telegramUserId === telegramUserId.toString());
    let details: string;

    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        telegramUserId: telegramUserId.toString(),
        firstName: first_name,
        lastName: last_name || '',
        telegramUsername: username || '',
        photo_url: photo_url || '',
      };
      users.push(user);
      details = `Нового користувача ${first_name} створено з ID ${user.id}.`;
    } else {
      details = `Існуючого користувача ${first_name} знайдено з ID ${user.id}.`;
    }
    // --- End Database Logic ---

    // Generate a short-lived temporary token, now including the rememberMe flag
    const tempToken = jwt.sign({ userId: user.id, rememberMe }, JWT_SECRET, { expiresIn: '5m' });
    
    return { tempToken, details };

  } catch (error) {
      console.error('Error in handleTelegramLogin:', error);
      return { error: 'An internal error occurred during login.' };
  }
}
