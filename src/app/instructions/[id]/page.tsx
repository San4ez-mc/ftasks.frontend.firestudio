
import React from 'react';
import type { Instruction } from '@/types/instruction';
import InstructionEditor from './_components/InstructionEditor';

// --- Mock Data ---
// In a real app, this data would be fetched from a database.

const mockUsers = [
  { id: 'user-1', name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
  { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
  { id: 'user-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
  { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
];

const mockInstruction: Instruction = {
    id: 'instr-1',
    title: 'Як створити нову маркетингову кампанію',
    department: 'Div 2 - Маркетинг',
    content: `<p>Це інструкція з <strong>форматуванням</strong>, яка пояснює ключові кроки для запуску успішної кампанії.</p>
<p><br></p>
<h2>Крок 1: Визначення цілей</h2>
<ul>
    <li>Чітко сформулюйте, що ви хочете досягти (наприклад, +20% лідів).</li>
    <li>Визначте KPI для вимірювання успіху.</li>
</ul>
<p><br></p>
<h2>Крок 2: Аналіз цільової аудиторії</h2>
<p>Створіть портрет ідеального клієнта (ICP), щоб краще зрозуміти його потреби та болі.</p>
<p><br></p>
<img src="https://picsum.photos/600/400?random=10" alt="Графік аналізу" data-ai-hint="chart analysis" >
<p><br></p>
<h2>Крок 3: Відео-інструкція</h2>
<p>Перегляньте це відео для детального розбору налаштувань рекламного кабінету:</p>
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameBorder="0" allowFullScreen></iframe>
`,
    accessList: [
      { userId: 'user-1', name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1', access: 'edit' },
      { userId: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2', access: 'view' },
    ]
};

// --- Main Page Component ---

type EditInstructionPageProps = {
  params: { id: string };
};

// This is now an async Server Component
export default async function EditInstructionPage({ params }: EditInstructionPageProps) {
  const { id } = params; // No await needed in Next.js 15 final release for `params`

  let instructionData: Instruction;

  if (id === 'new') {
    // Create a new instruction object for the client component
    instructionData = {
      id: `instr-${Date.now()}`,
      title: 'Нова інструкція',
      department: 'Не вказано',
      content: '<p>Почніть писати вашу інструкцію тут...</p>',
      accessList: [],
    };
  } else {
    // In a real app, you would fetch the instruction by id from your database here
    // For now, we'll use the mock data.
    instructionData = mockInstruction;
  }

  // Pass the fetched or created data to the client component for editing
  return <InstructionEditor initialInstruction={instructionData} allUsers={mockUsers} />;
}
