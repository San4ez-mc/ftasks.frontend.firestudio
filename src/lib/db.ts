// --- Mock Database ---
// In a real application, this would connect to a real database like PostgreSQL or Firestore.

import type { Result } from "@/types/result";
import type { Task } from "@/types/task";
import type { Template } from "@/types/template";
import type { Employee } from "@/types/company";
import type { MessageLog } from "@/types/telegram-group";

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
];

export let companyEmployees: Employee[] = [
    {
        id: 'emp-1',
        companyId: 'company-1',
        telegramUserId: '345126254',
        telegramUsername: 'olexandrmatsuk',
        firstName: 'Oleksandr',
        lastName: 'Matsuk',
        avatar: 'https://picsum.photos/100/100?random=1',
        status: 'active',
        notes: 'Ключовий розробник, спеціалізується на React та Next.js. Відповідальний за архітектуру фронтенду.',
        positions: ['pos-1', 'pos-7'],
        groups: ['grp-1'],
        synonyms: ['Alex', 'O.M.'],
        email: 'alex@fineko.dev',
        birthDate: '1990-05-15',
        telegramPermissions: ['create_task', 'create_result', 'view_tasks', 'list_employees'],
    },
    {
        id: 'emp-2',
        companyId: 'company-1',
        telegramUserId: 'tg-456',
        telegramUsername: 'maria_s',
        firstName: 'Марія',
        lastName: 'Сидоренко',
        avatar: 'https://picsum.photos/100/100?random=2',
        status: 'active',
        notes: 'Менеджер проектів, відповідає за комунікацію з клієнтами та планування спринтів.',
        positions: ['pos-3'],
        groups: ['grp-1', 'grp-2'],
        synonyms: ['Маша'],
        email: 'maria.s@fineko.dev',
        birthDate: '1992-11-20',
        telegramPermissions: ['create_task', 'create_result', 'view_tasks', 'list_employees'],
    },
     {
        id: 'emp-3',
        companyId: 'company-1',
        telegramUserId: 'tg-789',
        telegramUsername: 'olena_k',
        firstName: 'Олена',
        lastName: 'Ковальчук',
        avatar: 'https://picsum.photos/100/100?random=3',
        status: 'vacation',
        notes: 'Сильний дизайнер з досвідом у мобільних додатках.',
        positions: ['pos-5'],
        groups: ['grp-1'],
        synonyms: [],
        email: 'olena.k@fineko.dev',
        birthDate: '1995-03-10',
        telegramPermissions: ['create_task', 'create_result', 'view_tasks', 'list_employees'],
    },
    {
        id: 'emp-4',
        companyId: 'company-1',
        telegramUserId: 'tg-101',
        telegramUsername: 'petro_i',
        firstName: 'Петро',
        lastName: 'Іваненко',
        avatar: 'https://picsum.photos/100/100?random=4',
        status: 'active',
        notes: 'Засновник та ідейний лідер компанії.',
        positions: ['pos-6'],
        groups: ['grp-2'],
        synonyms: ['Петя'],
        email: 'petro@fineko.dev',
        birthDate: '1985-01-01',
        telegramPermissions: ['create_task', 'create_result', 'view_tasks', 'list_employees'],
    },
     {
        id: 'emp-5',
        companyId: 'company-1',
        telegramUserId: 'tg-112',
        telegramUsername: 'andriy_b',
        firstName: 'Андрій',
        lastName: 'Бондаренко',
        avatar: 'https://picsum.photos/100/100?random=5',
        status: 'inactive',
        notes: 'Спеціаліст з контекстної реклами та SEO.',
        positions: ['pos-4'],
        groups: ['grp-3'],
        synonyms: [],
        email: 'andriy.b@fineko.dev',
        birthDate: '1993-08-25',
        telegramPermissions: ['create_task', 'create_result', 'view_tasks', 'list_employees'],
    },
];

// Employee join table
export let employees = [
    { id: 'emp-1', userId: 'user-1', companyId: 'company-1', status: 'active', notes: '' },
];

export let tasksDb: Task[] = [];

export let resultsDb: Result[] = [
  {
    id: 'res-user-1',
    companyId: 'company-1',
    name: 'Запустити робочу воронку продаж і отримати з неї клієнтів на консалтинг',
    status: 'В роботі',
    completed: false,
    deadline: '2025-09-30',
    assignee: { id: 'emp-1', name: 'Oleksandr Matsuk', avatar: 'https://picsum.photos/100/100?random=1' },
    reporter: { id: 'emp-1', name: 'Oleksandr Matsuk', avatar: 'https://picsum.photos/100/100?random=1' },
    description: '',
    expectedResult: '',
    subResults: [
        { id: 'sub-user-1', name: 'реклама на міні курс', completed: false },
        { id: 'sub-user-2', name: 'записати міні курс', completed: false },
        { id: 'sub-user-3', name: 'створити автоматизований аудит', completed: false },
        { id: 'sub-user-4', name: 'створити автоматизований курс "як вийти з пастки власника"', completed: false },
    ],
    tasks: [],
    templates: [],
    comments: [],
    accessList: [],
  },
  {
    id: 'res-1',
    companyId: 'company-1',
    name: 'Запустити рекламну кампанію в Google Ads',
    status: 'В роботі',
    completed: false,
    isUrgent: true,
    deadline: '2024-09-01',
    assignee: { id: 'user-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
    reporter: { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
    description: 'Основна мета - залучити 1000 нових користувачів через пошукову рекламу. Бюджет 500$.',
    expectedResult: 'Залучено 1000 нових користувачів з конверсією не нижче 5%.',
    subResults: [
        { id: 'sub-1', name: 'Налаштувати аналітику', completed: true },
        { id: 'sub-2', name: 'Створити креативи', completed: false },
    ],
    tasks: [
        { id: 'task-5', title: 'Зібрати семантичне ядро', status: 'done' },
    ],
    templates: [
        { id: 'tpl-1', name: 'Щотижневий звіт по кампанії' }
    ],
    comments: [
        { id: 'comment-1', text: 'Не забудьте перевірити бюджети перед запуском.', author: { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4'}, timestamp: '2 години тому' }
    ],
    accessList: []
  },
  {
    id: 'res-2',
    companyId: 'company-1',
    name: 'Розробити новий модуль аналітики',
    status: 'Заплановано',
    completed: false,
    isUrgent: false,
    deadline: '2024-10-15',
    assignee: { id: 'user-1', name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
    reporter: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
    description: 'Інтегрувати нові дашборди для відстеження KPI в реальному часі.',
    expectedResult: 'Новий модуль аналітики доступний всім користувачам з роллю "Менеджер".',
    subResults: [],
    tasks: [],
    templates: [],
    comments: [],
    accessList: []
  },
  {
    id: 'res-3',
    companyId: 'company-1',
    name: 'Підготувати квартальний звіт для інвесторів',
    status: 'В роботі',
    completed: false,
    isUrgent: false,
    deadline: '2024-09-30',
    assignee: { id: 'emp-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/100/100?random=4' },
    reporter: { id: 'emp-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/100/100?random=4' },
    description: 'Звіт має містити аналіз фінансових показників, досягнень та планів на наступний квартал.',
    expectedResult: 'Фінальна версія звіту у форматі PDF надіслана усім інвесторам.',
    subResults: [
         { id: 'sub-3-1', name: 'Зібрати фінансові дані', completed: true },
         { id: 'sub-3-2', name: 'Проаналізувати маркетингові метрики', completed: true },
         { id: 'sub-3-3', name: 'Сформувати презентацію', completed: false },
    ],
    tasks: [],
    templates: [],
    comments: [],
    accessList: []
  },
   {
    id: 'res-4',
    companyId: 'company-1',
    name: 'Оновити дизайн головної сторінки',
    status: 'Відкладено',
    completed: false,
    isUrgent: false,
    deadline: '2024-08-25',
    assignee: { id: 'emp-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/100/100?random=4' },
    reporter: { id: 'emp-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/100/100?random=2' },
    description: 'Переробити UI/UX для підвищення конверсії на 15%.',
    expectedResult: 'Новий дизайн головної сторінки опубліковано.',
    subResults: [],
    tasks: [],
    templates: [],
    comments: [],
    accessList: []
  },
  {
    id: 'res-5',
    companyId: 'company-1',
    name: 'Провести A/B тестування цін',
    status: 'Виконано',
    completed: true,
    isUrgent: false,
    deadline: '2024-07-30',
    assignee: { id: 'emp-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/100/100?random=4' },
    reporter: { id: 'emp-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/100/100?random=3' },
    description: 'Визначити оптимальну цінову стратегію для нового продукту.',
    expectedResult: 'Звіт з результатами A/B тестування та рекомендаціями по ціноутворенню.',
    subResults: [],
    tasks: [],
    templates: [],
    comments: [],
    accessList: []
  },
];

export let templatesDb: Template[] = [
  { 
    id: '1', 
    companyId: 'company-1',
    name: 'Щоденний звіт', 
    repeatability: 'Щоденно о 9:00', 
    startDate: '2024-08-01',
    expectedResult: 'Звіт про виконані задачі за день',
    tasksGenerated: [
        { id: 't1-1', date: '2024-08-01', status: 'done'},
        { id: 't1-2', date: '2024-08-02', status: 'done'},
        { id: 't1-3', date: '2024-08-03', status: 'todo'},
    ],
    resultId: 'res-3',
    resultName: 'Підготувати квартальний звіт для інвесторів',
  },
  { 
    id: '2', 
    companyId: 'company-1',
    name: 'Щотижнева аналітика', 
    repeatability: 'Щотижня (Пн)', 
    startDate: '2024-07-29',
    expectedResult: 'Аналітичний звіт по ключових метриках за тиждень',
    tasksGenerated: [
        { id: 't2-1', date: '2024-07-29', status: 'done'},
        { id: 't2-2', date: '2024-08-05', status: 'todo'},
    ],
    resultId: 'res-1',
    resultName: 'Запустити рекламну кампанію в Google Ads',
  },
  { 
    id: '3', 
    companyId: 'company-1',
    name: 'Підготовка до щомісячної зустрічі', 
    repeatability: 'Щомісяця (25 число)', 
    startDate: '2024-06-25',
    expectedResult: 'Презентація з результатами місяця',
    tasksGenerated: [
        { id: 't3-1', date: '2024-06-25', status: 'done'},
        { id: 't3-2', date: '2024-07-25', status: 'done'},
    ],
  },
];

export let messageLogsDb: MessageLog[] = [];


// Export all tables as a single object for convenience
export const db = {
    users,
    companies,
    employees,
    companyEmployees,
    tasks: tasksDb,
    results: resultsDb,
    templates: templatesDb,
    messageLogs: messageLogsDb,
};
