
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleTelegramLogin } from '@/lib/telegram-auth';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

async function sendTelegramReply(chatId: number, loginUrl: string | null, errorMessage?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("Крок 5 (Помилка конфігурації): TELEGRAM_BOT_TOKEN не знайдено в env.");
    // Do not proceed if token is missing
    return;
  }

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  console.log(`Крок 5 (Підготовка до відправки): Цільовий URL Telegram API: ${apiUrl}`);

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
      
  console.log("Крок 5 (Payload):", JSON.stringify(payload, null, 2));

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
      const errorMessage = error instanceof Error ? error.message : "Unknown fetch error";
      console.error("Крок 5 (Критична помилка): Не вдалося виконати fetch-запит до Telegram API.", errorMessage, error);
  }
}


/**
 * This is the Next.js backend endpoint that Telegram will call.
 */
export async function POST(request: NextRequest) {
  console.log("Крок 1: Отримано запит на /api/telegram/webhook");
  
  let chatId: number | undefined;

  try {
    const body = await request.json();
    console.log("Тіло вебхука:", JSON.stringify(body, null, 2));


    if (body.message && body.message.text && body.message.text.startsWith('/start')) {
      const fromUser: TelegramUser = body.message.from;
      chatId = body.message.chat.id;

      // Extract payload from the /start command
      const commandText = body.message.text as string;
      const payload = commandText.split(' ')[1] || 'auth'; // e.g., "auth" or "auth_remember"
      const rememberMe = payload === 'auth_remember';

      // Directly call the login logic instead of using fetch
      const { tempToken, error, details } = await handleTelegramLogin(fromUser, rememberMe);
      console.log(`Крок 2: Пошук/створення користувача. Результат: ${details}`);

      if (error || !tempToken) {
        const errorMessage = error || 'Authentication failed. No token provided.';
        console.error(`Помилка на кроці 2/3: ${errorMessage}`);
        if (chatId) {
          await sendTelegramReply(chatId, null, `Authentication error: ${errorMessage}`);
        }
        return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
      }
      
      console.log("Крок 3: Тимчасовий токен успішно згенеровано.");
      
      const appUrl = "https://studio--fineko-tasktracker.us-central1.hosted.app";
      if (!appUrl) {
          console.error("Помилка конфігурації: NEXT_PUBLIC_APP_URL не знайдено.");
          throw new Error("Application URL is not configured.");
      }

      const redirectUrl = `${appUrl}/auth/telegram/callback?token=${tempToken}`;
      console.log(`Крок 4: URL для кнопки згенеровано: ${redirectUrl}`);
      
      if (chatId) {
        await sendTelegramReply(chatId, redirectUrl);
      } else {
        console.error("Не вдалося визначити chat_id для відправки відповіді.");
      }

      return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
    }

    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Критична помилка в обробнику вебхука:', errorMessage, error);
    if (chatId) {
        await sendTelegramReply(chatId, null, 'A critical server error occurred. Please contact support.');
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
