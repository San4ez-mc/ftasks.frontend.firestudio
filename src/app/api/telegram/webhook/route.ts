import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a mock of the Telegram Bot API response for user data
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

// This is a mock of the response from your backend API
interface BackendAuthResponse {
  token: string;
}

/**
 * Handles incoming webhook updates from the Telegram Bot API.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check for a message with the /start command
    if (body.message && body.message.text === '/start auth') {
      const fromUser: TelegramUser = body.message.from;
      const chatId = body.message.chat.id;

      // In a real application, you would now call your main backend
      // to find or create a user and get a temporary token.
      // For now, we'll simulate this.
      
      const finekoApiUrl = process.env.FINEKO_API_URL || 'https://api.tasks.fineko.space';
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://[YOUR_APP_URL]'; // Fallback URL

      // This is a conceptual call. Your backend would need an endpoint like this.
      const backendResponse = await fetch(`${finekoApiUrl}/auth/telegram/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramUser: fromUser }),
      });

      if (!backendResponse.ok) {
          throw new Error('Failed to authenticate with the backend.');
      }
      
      const { token: tempToken }: BackendAuthResponse = await backendResponse.json();

      // Construct the redirect URL for the user to complete login
      const redirectUrl = `${frontendUrl}/auth/telegram/callback?token=${tempToken}`;

      // Reply to the user in Telegram with a login button
      await sendTelegramReply(chatId, redirectUrl);

      return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
    }

    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Sends a reply message back to the user via the Telegram Bot API.
 */
async function sendTelegramReply(chatId: number, loginUrl: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables.");
  }
  
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const messagePayload = {
    chat_id: chatId,
    text: "Будь ласка, натисніть кнопку нижче, щоб завершити вхід.",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Завершити вхід у FINEKO",
            url: loginUrl,
          },
        ],
      ],
    },
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messagePayload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to send Telegram message:', errorData);
    throw new Error('Could not send reply to user.');
  }
}
