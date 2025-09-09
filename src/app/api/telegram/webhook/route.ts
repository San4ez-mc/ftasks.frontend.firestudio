
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleTelegramLogin, sendTelegramReply } from '@/lib/telegram-auth';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
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

      // Directly call the login logic instead of using fetch
      const { tempToken, error, details } = await handleTelegramLogin(fromUser);
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
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
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
    console.error('Критична помилка в обробнику вебхука:', errorMessage);
    if (chatId) {
        await sendTelegramReply(chatId, null, 'A critical server error occurred. Please contact support.');
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
