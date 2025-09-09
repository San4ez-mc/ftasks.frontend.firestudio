
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!telegramToken) {
    console.error("TELEGRAM_BOT_TOKEN is not defined in environment variables.");
    return NextResponse.json({ status: 'error', message: 'Server configuration error' }, { status: 500 });
  }

  let chatId: number | undefined;

  try {
    const body = await request.json();

    if (body.message && body.message.text && body.message.text.startsWith('/start')) {
      const fromUser: TelegramUser = body.message.from;
      chatId = body.message.chat.id;

      // The URL for our own internal API endpoint to handle the login logic
      const internalLoginApiUrl = new URL('/api/auth/telegram/login', request.url).toString();
      
      const response = await fetch(internalLoginApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fromUser)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Internal login failed.' }));
        if (chatId) {
          await sendTelegramReply(chatId, null, `Authentication error: ${errorData.message || 'Please try again.'}`);
        }
        return NextResponse.json({ status: 'error', message: 'Internal login failed' }, { status: 500 });
      }

      const { tempToken } = await response.json();
      
      if (!tempToken) {
          if (chatId) {
            await sendTelegramReply(chatId, null, 'Authentication failed. No token provided.');
          }
          return NextResponse.json({ status: 'error', message: 'tempToken missing from internal response' }, { status: 500 });
      }
      
      // Use the host from the request to build the redirect URL
      const frontendUrl = `https://${request.headers.get('host')}`;
      const redirectUrl = `${frontendUrl}/auth/telegram/callback?token=${tempToken}`;
      
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
