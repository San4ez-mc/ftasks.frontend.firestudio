
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a mock of the Telegram Bot API response for user data
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Handles incoming webhook updates from the Telegram Bot API.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the entire incoming message from Telegram for debugging
    console.log("Received from Telegram:", JSON.stringify(body, null, 2));

    // Check for a message with the /start command
    if (body.message && body.message.text && body.message.text.startsWith('/start')) {
      const fromUser: TelegramUser = body.message.from;
      const chatId = body.message.chat.id;

      // --- BACKEND API INTEGRATION ---
      // This webhook's job is to get the user data from Telegram and
      // forward it to our main backend to get a temporary token.

      const apiBaseUrl = process.env.API_BASE_URL || 'https://api.tasks.fineko.space';
      const response = await fetch(`${apiBaseUrl}/auth/telegram/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fromUser.id,
          first_name: fromUser.first_name,
          last_name: fromUser.last_name,
          username: fromUser.username,
          language_code: fromUser.language_code
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to get temp token from backend:', errorData);
        // Optionally, send an error message back to the user in Telegram
        await sendTelegramReply(chatId, null, 'An error occurred during authentication.');
        return NextResponse.json({ status: 'error', message: 'Backend login failed' }, { status: 500 });
      }

      const { tempToken } = await response.json();
      
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
      const redirectUrl = `${frontendUrl}/auth/telegram/callback?token=${tempToken}`;

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
async function sendTelegramReply(chatId: number, loginUrl: string | null, errorMessage?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables.");
  }
  
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  let messagePayload;
  if (loginUrl) {
    messagePayload = {
      chat_id: chatId,
      text: "Будь ласка, натисніть кнопку нижче, щоб завершити вхід.",
      reply_markup: {
        inline_keyboard: [
          [{
            text: "Завершити вхід у FINEKO",
            url: loginUrl,
          }],
        ],
      },
    };
  } else {
    messagePayload = {
      chat_id: chatId,
      text: errorMessage || "Щось пішло не так. Спробуйте ще раз.",
    };
  }


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
