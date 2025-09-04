
import type { Division, Position, Employee } from '@/types/org-structure';

export const mockDivisions: Division[] = [
  { id: 'div-1', name: 'Div 1 - Виконавча', description: 'Стратегія, цілі, управління', order: 1 },
  { id: 'div-2', name: 'Div 2 - Маркетинг', description: 'Ліди, контент, бренд', order: 2 },
  { id: 'div-3', name: 'Div 3 - Фінанси', description: 'Бюджети, P&L, платежі', order: 3 },
  { id: 'div-4', name: 'Div 4 - Виробництво', description: 'Виконання послуг, SLA', order: 4 },
  { id: 'div-5', name: 'Div 5 - Якість / HR', description: 'Найм, навчання, QA', order: 5 },
  { id: 'div-6', name: 'Div 6 - Продажі / PR', description: 'Продажі, клієнти, репутація', order: 6 },
  { id: 'div-7', name: 'Div 7 - Розвиток', description: 'Нові продукти, R&D', order: 7 },
];

export const mockEmployees: Employee[] = [
    { id: 'emp-1', name: 'Петро Іваненко', avatar: 'https://picsum.photos/100/100?random=4' },
    { id: 'emp-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/100/100?random=2' },
    { id: 'emp-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/100/100?random=3' },
    { id: 'emp-4', name: 'Іван Петренко', avatar: 'https://picsum.photos/100/100?random=1' },
    { id: 'emp-5', name: 'Андрій Бондаренко', avatar: 'https://picsum.photos/100/100?random=5' },
];

export const mockPositions: Position[] = [
  // Div 1
  { id: 'pos-1', name: 'CEO / Власник', divisionId: 'div-1', description: 'Стратегічні рішення, цілі компанії.', employeeIds: ['emp-1'], linkedProcessIds: 3, linkedKpiIds: 2 },
  { id: 'pos-2', name: 'Операційний директор', divisionId: 'div-1', description: 'Щоденне управління.', employeeIds: ['emp-2'], linkedProcessIds: 5, linkedKpiIds: 4 },
  
  // Div 2
  { id: 'pos-3', name: 'Head of Marketing', divisionId: 'div-2', description: 'Генерація лідів, воронки.', employeeIds: ['emp-3'], linkedProcessIds: 2, linkedKpiIds: 3 },
  { id: 'pos-4', name: 'SMM/Контент', divisionId: 'div-2', description: 'Ведення соцмереж.', employeeIds: [], linkedProcessIds: 1, linkedKpiIds: 1 },

  // Div 3
  { id: 'pos-5', name: 'CFO/Фінансист', divisionId: 'div-3', description: 'Бюджетування, фінмоделі.', employeeIds: ['emp-1'], linkedProcessIds: 2, linkedKpiIds: 2 },
  
  // Div 4
  { id: 'pos-6', name: 'Project Manager', divisionId: 'div-4', description: 'Ведення проектів клієнтів.', employeeIds: ['emp-2'], linkedProcessIds: 4, linkedKpiIds: 3 },
  { id: 'pos-7', name: 'Frontend Developer', divisionId: 'div-4', description: 'Розробка інтерфейсів.', employeeIds: ['emp-4'], linkedProcessIds: 1, linkedKpiIds: 1 },

  // Div 5
  { id: 'pos-8', name: 'HR Manager', divisionId: 'div-5', description: 'Підбір та адаптація.', employeeIds: ['emp-3'], linkedProcessIds: 3, linkedKpiIds: 2 },
  
  // Div 6
  { id: 'pos-9', name: 'Sales Manager', divisionId: 'div-6', description: 'Продаж послуг.', employeeIds: ['emp-5'], linkedProcessIds: 2, linkedKpiIds: 2 },

  // Div 7
  { id: 'pos-10', name: 'R&D Спеціаліст', divisionId: 'div-7', description: 'Дослідження нових технологій.', employeeIds: [], linkedProcessIds: 1, linkedKpiIds: 1 },
];
