
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

/**
 * This is the Next.js backend endpoint that Telegram will call.
 */
export async function POST(request: NextRequest) {
  console.log("Received a request on /api/telegram/webhook");

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!telegramToken) {
    console.error("TELEGRAM_BOT_TOKEN is not defined in environment variables.");
    return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
  }

  let chatId: number | undefined;

  try {
    const body = await request.json();
    console.log("Webhook body:", JSON.stringify(body, null, 2));


    if (body.message && body.message.text && body.message.text.startsWith('/start')) {
      const fromUser: TelegramUser = body.message.from;
      chatId = body.message.chat.id;

      // Directly call the login logic instead of using fetch
      const { tempToken, error } = await handleTelegramLogin(fromUser);

      if (error || !tempToken) {
        const errorMessage = error || 'Authentication failed. No token provided.';
        if (chatId) {
          await sendTelegramReply(chatId, null, `Authentication error: ${errorMessage}`);
        }
        return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
      }
      
      // Force HTTPS for the redirect URL that goes to the user's browser via Telegram.
      const host = request.headers.get('host');
      const redirectUrl = `https://${host}/auth/telegram/callback?token=${tempToken}`;
      
      if (chatId) {
        await sendTelegramReply(chatId, redirectUrl);
      }

      return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
    }

    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    console.error('Webhook Error:', error);
    if (chatId) {
        await sendTelegramReply(chatId, null, 'A critical server error occurred. Please contact support.');
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

async function sendTelegramReply(chatId: number, loginUrl: string | null, errorMessage?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
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

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to send Telegram message:', errorData);
  }
}
