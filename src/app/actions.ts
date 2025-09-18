
'use server';

import { sendTelegramMessage } from '@/lib/telegram-service';
import { getUserSession } from '@/lib/session';
import { getUserById, getCompanyProfileFromDb } from '@/lib/firestore-service';

// The user's ID for error reporting is now an environment variable
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

/**
 * A shared server action to report client-side errors to a specific Telegram user.
 * It formats the error details into a readable Markdown message.
 */
export async function reportClientError(errorInfo: { message: string; stack?: string; page?: string; digest?: string }) {
    if (!ADMIN_TELEGRAM_ID) {
        console.error("ADMIN_TELEGRAM_ID is not set in environment variables. Cannot report client error.");
        return { success: false };
    }

    try {
        const timestamp = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
        
        const escapeMarkdown = (text: string) => {
            if (!text) return '';
            // Escape all characters that are special in MarkdownV2
            return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
        }

        let header = `🔴 *Client-Side Error Report* 🔴`;
        let serverHint = '';

        if (errorInfo.message.includes('Server Components render')) {
            header = `🟠 *Server Render Error Caught on Client* 🟠`;
            serverHint = `\n*Note:* This is a server-side error\\. The details are minimal\\. Please check the server logs and use the *Digest* to find the corresponding error\\.`;
        }


        const message = `
${header}

*Time:* ${escapeMarkdown(timestamp)}
*Page:* ${escapeMarkdown(errorInfo.page || 'Unknown')}
*Digest:* \`${escapeMarkdown(errorInfo.digest || 'N/A')}\`
${serverHint}

*Error Message:*
\`\`\`
${escapeMarkdown(errorInfo.message)}
\`\`\`

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
         // Try to send a fallback message
        try {
            await sendTelegramMessage(parseInt(ADMIN_TELEGRAM_ID, 10), {
                text: `🔴 FAILED TO SEND FULL ERROR REPORT 🔴\nAn error occurred, but the reporting action itself also failed. Please check server logs immediately.`,
            });
        } catch (fallbackError) {
            console.error("Fallback error reporting also failed:", fallbackError);
        }
        return { success: false };
    }
}


/**
 * Sends a support message from a user to the admin's Telegram.
 */
export async function sendSupportMessage(message: string): Promise<{ success: boolean }> {
    if (!ADMIN_TELEGRAM_ID) {
        console.error("ADMIN_TELEGRAM_ID is not set in environment variables. Cannot send support message.");
        return { success: false };
    }
    
    try {
        const session = await getUserSession();
        if (!session) {
            throw new Error("User not authenticated.");
        }

        const [user, company] = await Promise.all([
            getUserById(session.userId),
            getCompanyProfileFromDb(session.companyId)
        ]);

        const timestamp = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
        
        const escapeMarkdown = (text: string | undefined | null) => text ? text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&') : '';

        const header = `💬 *New Support Message* 💬`;
        
        const companyName = company ? escapeMarkdown(company.name) : 'Unknown Company';
        const companyInfo = `*Company:* ${companyName} (\`${session.companyId}\`)`;

        const userInfo = user
            ? `*From:* ${escapeMarkdown(user.firstName)} ${escapeMarkdown(user.lastName)}\n*Telegram:* @${escapeMarkdown(user.telegramUsername || 'N/A')}\n*User ID:* \`${user.id}\``
            : `*From:* Unidentified User (\`${session.userId}\`)`;

        const formattedMessage = `
${header}

${userInfo}
${companyInfo}
*Time:* ${escapeMarkdown(timestamp)}

*Message:*
${escapeMarkdown(message)}
        `;

        await sendTelegramMessage(parseInt(ADMIN_TELEGRAM_ID, 10), {
            text: formattedMessage,
        });

        return { success: true };

    } catch (error) {
        console.error("Failed to send support message:", error);
        // Optionally, you could try to send a simplified error report
        await sendTelegramMessage(parseInt(ADMIN_TELEGRAM_ID, 10), {
            text: `🔴 Failed to process a support message. Check server logs.`
        });
        return { success: false };
    }
}
    
