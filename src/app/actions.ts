
'use server';

import { sendTelegramMessage } from '@/lib/telegram-service';

// The user's ID provided in the prompt for error reporting
const ADMIN_TELEGRAM_ID = '345126254';

/**
 * A shared server action to report client-side errors to a specific Telegram user.
 * It formats the error details into a readable Markdown message.
 */
export async function reportClientError(errorInfo: { message: string; stack?: string; page?: string; digest?: string }) {
    try {
        const timestamp = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
        
        // Telegram's MarkdownV2 requires escaping these characters
        const escapeMarkdown = (text: string) => {
            if (!text) return '';
            return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
        }

        const message = `
🔴 *Client-Side Error Report* 🔴

*Time:* ${escapeMarkdown(timestamp)}
*Page:* ${escapeMarkdown(errorInfo.page || 'Unknown')}
*Digest:* \`${escapeMarkdown(errorInfo.digest || 'N/A')}\`
*Error:* \`${escapeMarkdown(errorInfo.message)}\`

*Stack Trace:*
\`\`\`
${escapeMarkdown(errorInfo.stack || 'No stack trace available.')}
\`\`\`
        `;

        await sendTelegramMessage(parseInt(ADMIN_TELEGRAM_ID, 10), {
            text: message,
        });

        return { success: true };
    } catch (reportError) {
        console.error("Failed to report client-side error:", reportError);
        return { success: false };
    }
}
