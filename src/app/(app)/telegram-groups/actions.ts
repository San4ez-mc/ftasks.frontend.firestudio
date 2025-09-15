
'use server';

import { 
  linkTelegramGroup, 
  getAllTelegramGroups,
  getTelegramGroupById,
  createTelegramLog,
  getTelegramLogsByGroupId,
  getMembersForGroupDb,
  upsertTelegramMember,
  linkTelegramMemberToEmployeeInDb,
} from '@/lib/firestore-service';
import { getTelegramChatAdministrators } from '@/lib/telegram-service';
import { getUserSession } from '@/lib/session';
import type { TelegramGroup, MessageLog } from '@/types/telegram-group';
import type { TelegramMember } from '@/types/telegram-member';


/**
 * Fetches all Telegram groups linked to the company.
 */
export async function getGroups(): Promise<TelegramGroup[]> {
  const session = await getUserSession();
  if (!session) throw new Error("Not authenticated");

  try {
    const groups = await getAllTelegramGroups(session.companyId);
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
  const session = await getUserSession();
  if (!session) return { success: false, message: 'Not authenticated' };

  if (!code || code.trim().length !== 6) {
    return { success: false, message: 'Код має складатися з 6 символів.' };
  }
  
  try {
    const { group, wasCreated } = await linkTelegramGroup(code, session.companyId);
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
  const session = await getUserSession();
  if (!session) throw new Error("Not authenticated");
  
  const group = await getTelegramGroupById(session.companyId, groupId);
  if (!group) {
    throw new Error('Group not found or you do not have permission to access it.');
  }

  // The telegram-service will handle the bot token from environment variables.
  
  try {
    // This part would typically call the telegram-service to send a message
    // For now, we are just logging it to our DB.
    const logEntry = {
        groupId,
        timestamp: new Date().toISOString(),
        content: text,
        status: 'OK' as const,
        error: null,
    };
    return createTelegramLog(session.companyId, logEntry);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     const logEntry = {
        groupId,
        timestamp: new Date().toISOString(),
        content: text,
        status: 'Error' as const,
        error: errorMessage,
    };
    return createTelegramLog(session.companyId, logEntry);
  }
}

/**
 * Fetches message logs for a specific group.
 */
export async function getLogsForGroup(groupId: string): Promise<MessageLog[]> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return getTelegramLogsByGroupId(session.companyId, groupId);
}

// --- Member Management Actions ---

/**
 * Fetches the list of members for a given group from the database.
 */
export async function getGroupMembers(groupId: string): Promise<TelegramMember[]> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return getMembersForGroupDb(session.companyId, groupId);
}

/**
 * Fetches the latest member list (administrators) from Telegram and updates the database.
 */
export async function refreshGroupMembers(groupId: string, tgGroupId: string): Promise<TelegramMember[]> {
  const session = await getUserSession();
  if (!session) throw new Error("Not authenticated");

  try {
    const admins = await getTelegramChatAdministrators(tgGroupId);
  
    for (const admin of admins) {
      await upsertTelegramMember(session.companyId, {
        groupId,
        tgUserId: admin.user.id.toString(),
        tgFirstName: admin.user.first_name,
        tgLastName: admin.user.last_name || '',
        tgUsername: admin.user.username || '',
      });
    }

    return getMembersForGroupDb(session.companyId, groupId);
  } catch (error) {
    console.error("Error refreshing group members:", error);
    const errorMessage = error instanceof Error ? error.message : "Невідома помилка";
    // Re-throw a more user-friendly error
    throw new Error(`Не вдалося оновити склад: ${errorMessage}`);
  }
}

/**
 * Links or unlinks a Telegram member to a company employee.
 */
export async function linkTelegramMemberToEmployee(memberId: string, employeeId: string | null): Promise<TelegramMember | null> {
    const session = await getUserSession();
    if (!session) throw new Error("Not authenticated");
    return linkTelegramMemberToEmployeeInDb(session.companyId, memberId, employeeId);
}
