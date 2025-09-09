
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

export async function handleTelegramLogin(telegramUser: TelegramUser): Promise<{ tempToken?: string; error?: string; details?: string }> {
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

    // Generate a short-lived temporary token
    const tempToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '5m' });
    
    return { tempToken, details };

  } catch (error) {
      console.error('Error in handleTelegramLogin:', error);
      return { error: 'An internal error occurred during login.' };
  }
}


export async function sendTelegramReply(chatId: number, loginUrl: string | null, errorMessage?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("Крок 5 (Помилка конфігурації): TELEGRAM_BOT_TOKEN не знайдено в env.");
    return;
  }

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  console.log(`Крок 5 (Підготовка до відправки): Цільовий URL Telegram API: ${apiUrl.replace(botToken, "СКРИТИЙ_ТОКЕН")}`);

  const payload = loginUrl
    ? {
        chat_id: chatId,
        text: "Будь ласка, натисніть кнопку нижче, щоб завершити вхід.",
        reply_markup: {
          inline_keyboard: [[{ text: "Завершити вхід у FINEKO", url: loginUrl }]],
        },
      }
    : {
        chat_id: chatId,
        text: errorMessage || "Щось пішло не так. Спробуйте ще раз.",
      };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`Крок 5 (Помилка): Не вдалося надіслати повідомлення Telegram:`, responseData);
    } else {
        console.log("Крок 5 (Успіх): Повідомлення в Telegram успішно надіслано.");
    }
  } catch(error) {
      console.error("Крок 5 (Критична помилка): Не вдалося виконати fetch-запит до Telegram API.", error);
  }
}

