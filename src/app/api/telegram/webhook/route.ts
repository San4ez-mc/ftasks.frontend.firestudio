
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sign } from 'jsonwebtoken';

// This is a mock of the Telegram Bot API response for user data
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
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

      // --- SIMULATED TOKEN GENERATION ---
      // In a real application, you would first call your main backend to find or create a user.
      // For now, we simulate this to ensure the Telegram -> App flow works.
      // We'll create a temporary JWT token right here.
      
      const tempTokenSecret = process.env.TEMP_TOKEN_SECRET || 'your-temporary-secret-for-development';
      
      const tempToken = sign(
        { 
          userId: `tg-${fromUser.id}`, // Create a unique user ID based on telegram ID
          firstName: fromUser.first_name,
          lastName: fromUser.last_name,
          username: fromUser.username,
        },
        tempTokenSecret,
        { expiresIn: '5m' } // Token is valid for 5 minutes
      );
      
      // Use NEXT_PUBLIC_APP_URL for the frontend URL, falling back if not set.
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
      
      // Construct the redirect URL for the user to complete login
      const redirectUrl = `${frontendUrl}/auth/telegram/callback?token=${tempToken}`;

      // Reply to the user in Telegram with a login button
      await sendTelegramReply(chatId, redirectUrl);

      return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
    }

    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    console.error('Webhook error:', error);
    // Log the error to the server console
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
