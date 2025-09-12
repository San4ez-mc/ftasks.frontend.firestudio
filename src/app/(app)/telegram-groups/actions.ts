
'use server';

import { 
  linkTelegramGroup, 
  getAllTelegramGroups,
  getTelegramGroupById,
  createTelegramLog,
  getTelegramLogsByGroupId,
  getMembersForGroup as getMembersForGroupDb,
  upsertTelegramMember,
  linkTelegramMemberToEmployeeInDb,
} from '@/lib/firestore-service';
import type { TelegramGroup, MessageLog } from '@/types/telegram-group';
import type { TelegramMember } from '@/types/telegram-member';


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
    const { group, wasCreated } = await linkTelegramGroup(code, 'company-1');
    const message = wasCreated ? 'Групу успішно прив\'язано!' : 'Інформацію про групу оновлено!';
    return { success: true, message: message, data: group };
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

// --- Member Management Actions ---

/**
 * Fetches the list of members for a given group from the database.
 */
export async function getGroupMembers(groupId: string): Promise<TelegramMember[]> {
    return getMembersForGroupDb(groupId);
}

/**
 * Simulates fetching the latest member list from Telegram and updating the database.
 */
export async function refreshGroupMembers(groupId: string): Promise<TelegramMember[]> {
  // In a real app, this would call the Telegram Bot API to get chat members.
  // This is a complex operation and depends on bot permissions.
  // Here, we simulate the result by upserting a mock list of users.
  const mockFetchedMembers = [
    { tgUserId: '345126254', tgFirstName: 'Oleksandr', tgLastName: 'Matsuk', tgUsername: 'olexandrmatsuk' },
    { tgUserId: '67890', tgFirstName: 'Марія', tgLastName: 'Сидоренко', tgUsername: 'maria_s' },
    { tgUserId: '54321', tgFirstName: 'Олена', tgLastName: 'Ковальчук', tgUsername: 'olena_k' },
    { tgUserId: '99999', tgFirstName: 'Новий', tgLastName: 'Користувач', tgUsername: 'new_user' },
  ];

  // This loop creates/updates each member in the database.
  for (const member of mockFetchedMembers) {
    await upsertTelegramMember({ groupId, ...member });
  }

  // Return the full, updated list of members for the group.
  return getMembersForGroupDb(groupId);
}

/**
 * Links or unlinks a Telegram member to a company employee.
 */
export async function linkTelegramMemberToEmployee(memberId: string, employeeId: string | null): Promise<TelegramMember | null> {
    return linkTelegramMemberToEmployeeInDb(memberId, employeeId);
}
