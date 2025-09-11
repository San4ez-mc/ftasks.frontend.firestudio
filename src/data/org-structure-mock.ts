
import type { Division, Department, Employee, Section } from '@/types/org-structure';

export const mockDivisions: Division[] = [
  { id: 'div-1', name: '7. Адміністративне відділення', description: 'Керування, розвиток, PR', order: 1 },
  { id: 'div-2', name: '1. Відділення побудови', description: 'Побудова та адміністрування', order: 2 },
  { id: 'div-3', name: '2. Відділення розповсюдження', description: 'Маркетинг, Продажі', order: 3 },
  { id: 'div-4', name: '3. Фінансове відділення', description: 'Фінанси, Бухгалтерія', order: 4 },
  { id: 'div-5', name: '4. Технічне відділення', description: 'Виробництво та надання послуг', order: 5 },
  { id: 'div-6', name: '5. Відділення кваліфікації', description: 'Контроль якості та навчання', order: 6 },
  { id: 'div-7', name: '6. Відділення по роботі з публікою', description: 'Робота з персоналом та клієнтами', order: 7 },
];

export const mockEmployees: Employee[] = [
    { id: 'emp-1', name: 'Петро Іваненко', avatar: 'https://picsum.photos/100/100?random=4' },
    { id: 'emp-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/100/100?random=2' },
    { id: 'emp-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/100/100?random=3' },
    { id: 'emp-4', name: 'Іван Петренко', avatar: 'https://picsum.photos/100/100?random=1' },
    { id: 'emp-5', name: 'Андрій Бондаренко', avatar: 'https://picsum.photos/100/100?random=5' },
    { id: 'emp-6', name: 'Сергій Вовк', avatar: 'https://picsum.photos/100/100?random=6' },
    { id: 'emp-7', name: 'Юлія Лисенко', avatar: 'https://picsum.photos/100/100?random=7' },
];

export const mockDepartments: Department[] = [
    // This can be kept empty initially, so user can build from templates
];

export const departmentTemplates: Record<string, { name: string; ckp: string }[]> = {
  'div-1': [
    { name: 'Відділ Власника', ckp: 'Стратегічні плани, що забезпечують розвиток та розширення компанії' },
  ],
  'div-2': [
    { name: 'Адміністративний відділ', ckp: 'Оргполітика, що описана, впроваджена та застосовується' },
  ],
  'div-3': [
    { name: 'Відділ продажів', ckp: 'Потенційні клієнти, що зацікавились та звернулись до компанії' },
  ],
  'div-4': [
    { name: 'Фінансовий відділ', ckp: 'Своєчасно виставлені рахунки та зібрана дебіторська заборгованість' },
  ],
  'div-5': [
    { name: 'Виробничий відділ', ckp: 'Своєчасно та якісно надані послуги' },
  ],
  'div-6': [
    { name: 'Відділ якості', ckp: 'Виявлені та виправлені помилки у наданих послугах' },
  ],
  'div-7': [
    { name: 'Відділ персоналу', ckp: 'Продуктивні співробітники, найняті та введені на посаду' },
  ],
};

export const sectionTemplates: Record<string, { name: string; ckp: string }[]> = {
    'dept-1': [ // Corresponds to 'Відділ Власника'
        { name: 'Секція Засновника', ckp: 'Ідеологія компанії, що підтримується та застосовується' },
        { name: 'Секція Ради Директорів', ckp: 'Стратегічні плани, що забезпечують розвиток та розширення компанії' },
        { name: 'Секція Виконавчого Директора', ckp: 'Діючий бізнес, що відповідає задумам власників' },
    ],
    // Add other department sections here if needed from schemas...
};

// --- Deprecated Data ---
export const mockPositions = [];
