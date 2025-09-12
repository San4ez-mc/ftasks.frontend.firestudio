
'use server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

type TelegramReply = {
    text: string;
    reply_markup?: any;
};

type TelegramResponse = {
    ok: boolean;
    description?: string;
    [key: string]: any;
};

async function telegramApiFetch(endpoint: string, payload: object): Promise<any> {
    if (!BOT_TOKEN) {
        throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables.");
    }

    const url = `${API_BASE_URL}/${endpoint}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Telegram API Error: ${data.description || 'Unknown error'}`);
        }
        
        return data.result;

    } catch (error) {
        console.error(`Failed to execute fetch request to Telegram API endpoint: ${endpoint}`, error);
        throw error; // Re-throw the error to be handled by the caller
    }
}


/**
 * Sends a message to a Telegram chat.
 * @param chatId The ID of the target chat.
 * @param message The message object to send.
 * @returns The response from the Telegram API.
 */
export async function sendTelegramMessage(chatId: number, message: TelegramReply): Promise<TelegramResponse> {
  const payload: any = {
    chat_id: chatId,
    text: message.text,
    parse_mode: 'Markdown'
  };

  if (message.reply_markup) {
    payload.reply_markup = message.reply_markup;
  }
  
  try {
      const result = await telegramApiFetch('sendMessage', payload);
      return { ok: true, result };
  } catch (error) {
      return { ok: false, description: error instanceof Error ? error.message : 'Unknown fetch error' };
  }
}

/**
 * Gets the list of administrators in a chat.
 * @param chatId The ID of the target chat.
 * @returns A promise that resolves to an array of chat members.
 */
export async function getTelegramChatAdministrators(chatId: string): Promise<any[]> {
    return telegramApiFetch('getChatAdministrators', { chat_id: chatId });
}
