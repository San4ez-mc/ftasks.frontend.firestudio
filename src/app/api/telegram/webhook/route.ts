
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import getConfig from 'next/config';

// This is a mock of the Telegram Bot API response for user data
interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

/**
 * Handles incoming webhook updates from the Telegram Bot API.
 */
export async function POST(request: NextRequest) {
  // Enhanced logging to debug environment variables
  console.log("--- START OF WEBHOOK INVOCATION ---");
  
  const telegramToken = serverRuntimeConfig.telegramBotToken;

  if (!telegramToken) {
      console.error("CRITICAL FAILURE: TELEGRAM_BOT_TOKEN is not found in next/config.");
      console.log("All available server runtime config:", JSON.stringify(serverRuntimeConfig));
  } else {
      console.log("SUCCESS: TELEGRAM_BOT_TOKEN was found.");
  }

  console.log("STEP 1: Webhook received a request from Telegram.");
  let chatId: number | undefined;

  try {
    const body = await request.json();

    console.log("STEP 1 SUCCESS: Sucessfully parsed request body:", JSON.stringify(body, null, 2));

    // Updated check for the /start command
    if (body.message && body.message.text && body.message.text === '/start') {
      const fromUser: TelegramUser = body.message.from;
      chatId = body.message.chat.id;

      console.log(`Identified chat ID: ${chatId}`);
      
      const apiBaseUrl = publicRuntimeConfig.apiBaseUrl || 'https://api.tasks.fineko.space';
      const loginEndpoint = `${apiBaseUrl}/auth/telegram/login`;
      
      console.log(`STEP 2: Attempting to send POST request to backend at ${loginEndpoint}`);
      const response = await fetch(loginEndpoint, {
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
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse backend error response.' }));
        console.error(`STEP 2 FAILURE: Backend request failed with status ${response.status}`, errorData);
        await sendTelegramReply(chatId, null, `An error occurred during authentication: ${errorData.message || 'Please try again later.'}`);
        return NextResponse.json({ status: 'error', message: 'Backend login failed' }, { status: 500 });
      }
      
      console.log("STEP 2 SUCCESS: Backend request was successful.");

      const { tempToken } = await response.json();
      
      if (!tempToken) {
          console.error('STEP 3 FAILURE: Backend response is missing tempToken.');
          await sendTelegramReply(chatId, null, 'Authentication failed. The server did not provide a login token.');
          return NextResponse.json({ status: 'error', message: 'tempToken missing from backend response' }, { status: 500 });
      }
      
      // Use NEXT_PUBLIC_APP_URL for the frontend URL if available
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
      const redirectUrl = `${frontendUrl}/auth/telegram/callback?token=${tempToken}`;

      console.log(`STEP 3: Generated redirect URL: ${redirectUrl}`);
      
      await sendTelegramReply(chatId, redirectUrl);

      console.log("STEP 3 SUCCESS: Reply with login button sent to user.");
      return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
    }

    console.log("Webhook finished: No action taken as message was not a /start command.");
    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    console.error('CRITICAL WEBHOOK ERROR:', error);
    if (chatId) {
        await sendTelegramReply(chatId, null, 'A critical server error occurred. Please contact support.').catch(e => console.error("Failed to send critical error reply:", e));
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Sends a reply message back to the user via the Telegram Bot API.
 */
async function sendTelegramReply(chatId: number, loginUrl: string | null, errorMessage?: string) {
  const botToken = serverRuntimeConfig.telegramBotToken;
  if (!botToken) {
    console.error("CRITICAL: TELEGRAM_BOT_TOKEN is not set in environment variables via next/config.");
    throw new Error("TELEGRAM_BOT_TOKEN is not set.");
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
