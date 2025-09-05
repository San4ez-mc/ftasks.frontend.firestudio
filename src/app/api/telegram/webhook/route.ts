import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

// A mock function to simulate finding or creating a user in your database
async function findOrCreateUser(telegramUser: { id: number; first_name: string; last_name?: string; username?: string }) {
  // In a real application, you would query your database here.
  // For now, we'll just return a mock user object.
  console.log('Finding or creating user:', telegramUser);
  return {
    id: `user-${telegramUser.id}`, // Your internal user ID
    firstName: telegramUser.first_name,
    lastName: telegramUser.last_name,
    telegramUserId: telegramUser.id,
    telegramUsername: telegramUser.username,
  };
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the entire incoming update object for debugging
    console.log('Received Telegram update:', JSON.stringify(body, null, 2));

    const message = body.message;

    // Check if it's a message and contains the /start auth command
    if (message && message.text === '/start auth') {
      const from = message.from;
      if (!from) {
        throw new Error('Message "from" object is missing.');
      }

      // 1. Find or create user in your database
      const user = await findOrCreateUser(from);

      // 2. Generate a temporary, short-lived JWT
      const temporaryToken = jwt.sign(
        { userId: user.id, telegramUserId: from.id },
        JWT_SECRET,
        { expiresIn: '5m' } // Token is valid for 5 minutes
      );

      // 3. Construct the redirect URL
      const redirectUrl = `${APP_URL}/auth/telegram/callback?token=${temporaryToken}`;

      // 4. Send a reply message with an inline keyboard button
      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: from.id,
          text: 'Welcome to FINEKO! Click the button below to complete your login.',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Complete Login',
                  url: redirectUrl,
                },
              ],
            ],
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send message to Telegram:', errorData);
        throw new Error(`Telegram API error: ${errorData.description}`);
      }

       return NextResponse.json({ status: 'ok', message: 'Login link sent.' });

    } else {
       // Handle other messages or commands if needed
       return NextResponse.json({ status: 'ok', message: 'Update received, but no action taken.' });
    }

  } catch (error) {
    console.error('Error in Telegram webhook:', error);
    // Return a 200 OK response even on errors to prevent Telegram from resending the update
    return NextResponse.json({ status: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred.' }, { status: 200 });
  }
}
