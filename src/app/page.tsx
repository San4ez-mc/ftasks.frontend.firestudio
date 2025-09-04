
'use client';

import type { Task } from '@/types/task';
import { useState } from 'react';
import {
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TasksHeader from '@/components/tasks/tasks-header';
import TaskItem from '@/components/tasks/task-item';
import { Input } from '@/components/ui/input';
import ResultsList from '@/components/tasks/results-list';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';


const initialTasks: Task[] = [
    { 
        id: '1', 
        title: 'Розробити API для авторизації', 
        dueDate: '2024-08-15', 
        status: 'todo', 
        type: 'important-urgent', 
        expectedTime: 60,
        assignee: { name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
        reporter: { name: 'Марія Сидоренко' }
    },
    { 
        id: '2', 
        title: 'Створити UI/UX для сторінки задач', 
        dueDate: '2024-08-20', 
        status: 'todo',
        type: 'important-not-urgent',
        expectedTime: 120,
        assignee: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        reporter: { name: 'Марія Сидоренко' }
    },
    { 
        id: '3', 
        title: 'Налаштувати інтеграцію з Telegram', 
        dueDate: '2024-08-18', 
        status: 'done',
        type: 'not-important-urgent',
        expectedTime: 45,
        assignee: { name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
        reporter: { name: 'Марія Сидоренко' }
    },
    { 
        id: '4', 
        title: 'Підготувати презентацію для клієнта', 
        dueDate: '2024-08-10', 
        status: 'todo',
        type: 'not-important-not-urgent',
        expectedTime: 30,
        assignee: { name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
        reporter: { name: 'Марія Сидоренко' }
    },
];


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    // Here you would fetch tasks for the new date
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  }

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-6">
        {/* Main Content */}
        <div className="md:col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          <TasksHeader 
            currentDate={currentDate}
            onDateChange={handleDateChange}
          />
          <div className="flex-1 flex flex-col gap-4">
            <Input placeholder="Нова задача..." className="bg-card"/>
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onSelect={() => handleTaskSelect(task)}
                  onUpdate={handleTaskUpdate}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-12 lg:col-span-4 xl:col-span-3">
          <ResultsList />
        </div>
      </main>

       {/* Task Details Panel */}
      <Sheet open={!!selectedTask} onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          {selectedTask && (
            <div className="p-6">
                 <SheetHeader>
                    <SheetTitle>Task Details</SheetTitle>
                </SheetHeader>
                <p>Details for: {selectedTask.title}</p>
                 {/* Full task detail form will go here */}
            </div>
          )}
        </SheetContent>
      </Sheet>


      {/* FAB */}
      <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
        <Plus className="h-8 w-8" />
        <span className="sr-only">Створити задачу</span>
      </Button>
    </div>
  );
}
