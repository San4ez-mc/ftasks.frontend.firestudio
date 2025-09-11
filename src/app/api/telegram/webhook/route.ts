
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleTelegramLogin, generateGroupLinkCode } from '@/lib/telegram-auth';

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
    id: number;
    title: string;
    type: 'private' | 'group' | 'supergroup';
}


async function sendTelegramReply(chatId: number, message: {text: string, reply_markup?: any}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not defined.");
    return;
  }

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    ...message
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`Failed to send Telegram message:`, responseData);
    } else {
        console.log("Successfully sent Telegram message.");
    }
  } catch(error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown fetch error";
      console.error("Failed to execute fetch request to Telegram API.", errorMessage, error);
  }
}


/**
 * This is the Next.js backend endpoint that Telegram will call.
 */
export async function POST(request: NextRequest) {
  console.log("Webhook request received");
  
  try {
    const body = await request.json();
    console.log("Webhook body:", JSON.stringify(body, null, 2));

    // Check for message and /start command
    if (body.message && body.message.text && body.message.text.startsWith('/start')) {
        const chat: TelegramChat = body.message.chat;
        
        // --- Group Linking Flow ---
        if (chat.type === 'group' || chat.type === 'supergroup') {
            const { code, error } = await generateGroupLinkCode(chat.id.toString(), chat.title);
            if (error || !code) {
                 await sendTelegramReply(chat.id, { text: `Не вдалося згенерувати код для прив'язки: ${error}` });
                 return NextResponse.json({ status: 'error', message: error }, { status: 500 });
            }
            
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://studio--fineko-tasktracker.us-central1.hosted.app";
            const linkUrl = `${appUrl}/telegram-groups`;
            
            await sendTelegramReply(chat.id, {
                text: `Для прив'язки цієї групи до FINEKO, адміністратор має ввести цей код на сторінці 'Телеграм групи':\n\n*${code}*\n\nКод дійсний 10 хвилин.`,
                reply_markup: {
                    inline_keyboard: [[{ text: "Перейти до FINEKO", url: linkUrl }]]
                }
            });

            return NextResponse.json({ status: 'ok', message: 'Group link code sent.' });
        }
        
        // --- Private Chat Login Flow ---
        if (chat.type === 'private') {
            const fromUser: TelegramUser = body.message.from;
            const commandText = body.message.text as string;
            const payload = commandText.split(' ')[1] || 'auth';
            const rememberMe = payload === 'auth_remember';

            const { tempToken, error, details } = await handleTelegramLogin(fromUser, rememberMe);
            console.log(`User lookup/creation result: ${details}`);

            if (error || !tempToken) {
                const errorMessage = error || 'Authentication failed. No token provided.';
                await sendTelegramReply(chat.id, { text: `Помилка автентифікації: ${errorMessage}` });
                return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
            }
            
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://studio--fineko-tasktracker.us-central1.hosted.app";
            const redirectUrl = `${appUrl}/auth/telegram/callback?token=${tempToken}`;

            await sendTelegramReply(chat.id, {
                text: "Будь ласка, натисніть кнопку нижче, щоб завершити вхід.",
                reply_markup: {
                    inline_keyboard: [[{ text: "Завершити вхід у FINEKO", url: redirectUrl }]]
                }
            });

            return NextResponse.json({ status: 'ok', message: 'Login link sent.' });
        }
    }

    return NextResponse.json({ status: 'ok', message: 'Webhook received, but no action taken.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Critical error in webhook handler:', errorMessage, error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

