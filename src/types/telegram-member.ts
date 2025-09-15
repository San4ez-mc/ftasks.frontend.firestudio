
export interface TelegramMember {
    id: string; // Firestore doc ID
    companyId: string;
    groupId: string;
    tgUserId: string;
    tgFirstName: string;
    tgLastName?: string;
    tgUsername?: string;
    employeeId?: string | null; // Link to Employee in employees collection
}
