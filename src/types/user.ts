
export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  avatar?: string; // URL
  telegramUserId?: string;
  telegramUsername?: string;
}
