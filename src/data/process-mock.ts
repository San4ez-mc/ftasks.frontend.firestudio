
import type { Process, User } from '@/types/process';

// --- Mock Data ---

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
  { id: 'user-2', name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
  { id: 'user-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
  { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
];

export const mockInitialProcess: Process = {
  id: '1',
  name: 'Процес найму та онбордингу нового співробітника',
  description: 'Повний цикл від створення вакансії до першого робочого дня та адаптації.',
  lanes: [
    {
      id: 'lane-1',
      role: 'Керівник відділу',
      sectionId: 'sec-1', // Placeholder sectionId
      steps: [
        { id: 'step-1', name: 'Створення заявки на вакансію', responsibleId: 'user-1', order: 1, connections: [{ to: 'step-2' }], status: 'ok', notes: '', isDataSavePoint: true, dataSaveLocation: 'CRM > New Vacancy Request' },
        { id: 'step-6', name: 'Технічна співбесіда', responsibleId: 'user-2', order: 6, connections: [{ to: 'step-7' }], status: 'ok', notes: '' },
        { id: 'step-7', name: 'Фінальна співбесіда', responsibleId: 'user-1', order: 7, connections: [{ to: 'step-8' }], status: 'ok', notes: '' },
        { id: 'step-9', name: 'Підготовка плану на випробувальний термін', responsibleId: 'user-1', order: 9, connections: [{ to: 'step-12' }], status: 'new', notes: 'Важливо чітко визначити цілі' },
        { id: 'step-12', name: 'Проведення першої зустрічі', responsibleId: 'user-1', order: 12, connections: [{ to: 'step-15' }], status: 'ok', notes: '' },
        { id: 'step-15', name: 'Щотижневі one-to-one', responsibleId: 'user-1', order: 15, connections: [{ to: 'step-18' }], status: 'ok', notes: '' },
        { id: 'step-18', name: 'Оцінка за результатами випробувального терміну', responsibleId: 'user-1', order: 18, connections: [], status: 'ok', notes: '', isDataSavePoint: true, dataSaveLocation: 'HRIS > Employee Record' },
      ],
    },
    {
      id: 'lane-2',
      role: 'HR Менеджер',
      sectionId: 'sec-2', // Placeholder sectionId
      steps: [
        { id: 'step-2', name: 'Публікація вакансії', responsibleId: 'user-3', order: 2, connections: [{ to: 'step-3' }], status: 'ok', notes: '' },
        { id: 'step-3', name: 'Скринінг резюме', responsibleId: 'user-3', order: 3, connections: [{ to: 'step-4' }], status: 'ok', notes: '', isDataSavePoint: true, dataSaveLocation: 'Applicant Tracking System' },
        { id: 'step-4', name: 'Первинна співбесіда з HR', responsibleId: 'user-3', order: 4, connections: [{ to: 'step-5' }], status: 'ok', notes: '' },
        { id: 'step-5', name: 'Надсилання тестового завдання', responsibleId: 'user-3', order: 5, connections: [{ to: 'step-6' }], status: 'outdated', notes: 'Оновити тестове для Frontend' },
        { id: 'step-8', name: 'Формування та надсилання оферу', responsibleId: 'user-3', order: 8, connections: [{ to: 'step-10' }], status: 'ok', notes: '', isDataSavePoint: true, dataSaveLocation: 'HRIS > Candidate Profile' },
        { id: 'step-10', name: 'Підписання документів', responsibleId: 'user-3', order: 10, connections: [{ to: 'step-11' }], status: 'ok', notes: 'Важливо перевірити всі підписи' },
        { id: 'step-13', name: 'Знайомство з командою та офісом', responsibleId: 'user-3', order: 13, connections: [{ to: 'step-14' }], status: 'ok', notes: '' },
        { id: 'step-16', name: 'Збір проміжного фідбеку', responsibleId: 'user-3', order: 16, connections: [{ to: 'step-17' }], status: 'ok', notes: '' },
        { id: 'step-17', name: 'Фінальний фідбек від HR', responsibleId: 'user-3', order: 17, connections: [{ to: 'step-18' }], status: 'ok', notes: '' },
      ],
    },
    {
      id: 'lane-3',
      role: 'IT Спеціаліст',
      sectionId: 'sec-3', // Placeholder sectionId
      steps: [
        { id: 'step-11', name: 'Налаштування робочого місця та доступів', responsibleId: 'user-2', order: 11, connections: [{ to: 'step-12' }], status: 'problematic', notes: 'Замовити новий монітор, старий мерехтить' },
      ],
    },
    {
        id: 'lane-4',
        role: 'Бухгалтерія',
        sectionId: 'sec-4', // Placeholder sectionId
        steps: [
            { id: 'step-14', name: 'Внесення в payroll систему', responsibleId: 'user-4', order: 14, connections: [{ to: 'step-15' }], status: 'ok', notes: '', isDataSavePoint: true, dataSaveLocation: 'Payroll System' },
        ],
    },
  ],
};
