
// --- Mock Database ---
// In a real application, this would connect to a real database like PostgreSQL or Firestore.

// User table based on docs/database-schema.md
export let users = [
    {
        id: 'user-1',
        telegramUserId: '345126254',
        firstName: 'Oleksandr',
        lastName: 'Matsuk',
        telegramUsername: 'olexandrmatsuk',
        photo_url: ''
    }
];

// Company table
export let companies = [
    { id: 'company-1', name: 'Fineko Development', ownerId: 'user-1' },
    { id: 'company-2', name: 'My Startup Project', ownerId: 'user-1' }
];

// Employee join table
export let employees = [
    { id: 'emp-1', userId: 'user-1', companyId: 'company-1', status: 'active', notes: '' },
    { id: 'emp-2', userId: 'user-1', companyId: 'company-2', status: 'active', notes: '' }
];

// Export all tables as a single object for convenience
export const db = {
    users,
    companies,
    employees,
};
