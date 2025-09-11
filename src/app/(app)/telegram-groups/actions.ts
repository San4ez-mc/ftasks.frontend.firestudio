'use server';

import { linkTelegramGroup, getAllTelegramGroups } from '@/lib/firestore-service';
import type { TelegramGroup } from '@/types/telegram-group';

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
