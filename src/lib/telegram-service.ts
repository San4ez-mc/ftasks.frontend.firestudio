
'use server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

type TelegramReply = {
    text: string;
    reply_markup?: any;
};

type TelegramResponse = {
    ok: boolean;
    description?: string;
    [key: string]: any;
};

/**
 * Sends a message to a Telegram chat.
 * @param chatId The ID of the target chat.
 * @param message The message object to send.
 * @returns The response from the Telegram API.
 */
export async function sendTelegramMessage(chatId: number, message: TelegramReply): Promise<TelegramResponse> {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not defined.");
    return { ok: false, description: "Server configuration error: Bot token is missing." };
  }

  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  const payload: any = {
    chat_id: chatId,
    text: message.text,
    parse_mode: 'Markdown'
  };

  if (message.reply_markup) {
    payload.reply_markup = message.reply_markup;
  }

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
    return responseData;

  } catch(error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown fetch error";
      console.error("Failed to execute fetch request to Telegram API.", errorMessage, error);
      return { ok: false, description: `Network or fetch error: ${errorMessage}` };
  }
}
