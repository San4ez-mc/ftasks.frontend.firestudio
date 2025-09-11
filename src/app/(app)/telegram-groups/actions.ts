
'use server';

import { 
  linkTelegramGroup, 
  getAllTelegramGroups,
  getTelegramGroupById,
  createTelegramLog,
  getTelegramLogsByGroupId,
} from '@/lib/firestore-service';
import type { TelegramGroup, MessageLog } from '@/types/telegram-group';


/**
 * Fetches all Telegram groups linked to the company.
 */
export async function getGroups(): Promise<TelegramGroup[]> {
  // In a real multi-company app, you'd pass a companyId here.
  // For now, we assume a single company context.
  try {
    const groups = await getAllTelegramGroups('company-1');
    return groups;
  } catch (error) {
    console.error('Error fetching Telegram groups:', error);
    return [];
  }
}

/**
 * Links a Telegram group to the company using a verification code.
 */
export async function linkGroup(code: string): Promise<{ success: boolean; message: string; data?: TelegramGroup }> {
  if (!code || code.trim().length !== 6) {
    return { success: false, message: 'Код має складатися з 6 символів.' };
  }
  
  try {
    // Hardcoded companyId for now
    const newGroup = await linkTelegramGroup(code, 'company-1');
    return { success: true, message: 'Групу успішно прив\'язано!', data: newGroup };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Невідома помилка.';
    return { success: false, message: `Помилка прив'язки: ${message}` };
  }
}

/**
 * Sends a message to a specified Telegram group.
 */
export async function sendMessageToGroup(groupId: string, text: string): Promise<MessageLog> {
  const group = await getTelegramGroupById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined.");
  }

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: group.tgGroupId,
    text: text,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.description || 'Failed to send message');
    }
    
    // Log success
    const logEntry = {
        groupId,
        timestamp: new Date().toISOString(),
        content: text,
        status: 'OK' as const,
        error: null,
    };
    return createTelegramLog(logEntry);

  } catch (error) {
    // Log error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     const logEntry = {
        groupId,
        timestamp: new Date().toISOString(),
        content: text,
        status: 'Error' as const,
        error: errorMessage,
    };
    return createTelegramLog(logEntry);
  }
}

/**
 * Fetches message logs for a specific group.
 */
export async function getLogsForGroup(groupId: string): Promise<MessageLog[]> {
    return getTelegramLogsByGroupId(groupId);
}
