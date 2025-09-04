
'use client';

import type { Task } from '@/types/task';
import { useState, useRef, useEffect } from 'react';
import {
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TasksHeader from '@/components/tasks/tasks-header';
import TaskItem from '@/components/tasks/task-item';
import { Input } from '@/components/ui/input';
import TaskDetailsPanel from '@/components/tasks/task-details-panel';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const initialTasks: Task[] = [
    { 
        id: '1', 
        title: 'Розробити API для авторизації', 
        dueDate: '2024-08-15', 
        status: 'todo', 
        type: 'important-urgent', 
        expectedTime: 60,
        assignee: { name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
        reporter: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        resultName: 'Розробити новий модуль аналітики',
    },
    { 
        id: '2', 
        title: 'Створити UI/UX для сторінки задач', 
        dueDate: '2024-08-20', 
        status: 'todo',
        type: 'important-not-urgent',
        expectedTime: 120,
        assignee: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        reporter: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' }
    },
    { 
        id: '3', 
        title: 'Налаштувати інтеграцію з Telegram', 
        dueDate: '2024-08-18', 
        status: 'done',
        type: 'not-important-urgent',
        expectedTime: 45,
        actualTime: 50,
        expectedResult: 'Інтеграція має бути налаштована',
        actualResult: 'Інтеграція налаштована і протестована',
        assignee: { name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
        reporter: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
        resultName: 'Запустити рекламну кампанію в Google Ads'
    },
    { 
        id: '4', 
        title: 'Підготувати презентацію для клієнта', 
        dueDate: '2024-08-10', 
        status: 'todo',
        type: 'not-important-not-urgent',
        expectedTime: 30,
        assignee: { name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
        reporter: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' }
    },
];


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const newTaskInputRef = useRef<HTMLInputElement>(null);
  const taskTitleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTask && taskTitleInputRef.current) {
        taskTitleInputRef.current.focus();
    }
  }, [selectedTask]);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    // Here you would fetch tasks for the new date
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (selectedTask && selectedTask.id === updatedTask.id) {
        setSelectedTask(updatedTask);
    }
  }

  const createNewTask = (title: string, resultName?: string): Task => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title,
      dueDate: currentDate.toISOString().split('T')[0],
      status: 'todo',
      type: 'important-not-urgent', // Default type
      expectedTime: 30, // Default time
      expectedResult: 'Очікуваний результат генерується GPT',
      assignee: { name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40' }, // Placeholder for current user
      reporter: { name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40?random=5' }, // Placeholder for current user
      resultName: resultName,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    return newTask;
  };

  const handleNewTaskKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const inputElement = event.currentTarget;
      const title = inputElement.value.trim();
      if (title) {
        const newTask = createNewTask(title);
        setSelectedTask(newTask);
        inputElement.value = '';
      }
    }
  };

  const handleFabClick = () => {
    const newTask = createNewTask('');
    setSelectedTask(newTask);
    setTimeout(() => newTaskInputRef.current?.focus(), 0);
  };
  
  const handleClosePanel = () => {
    setSelectedTask(null);
  };

  return (
    <div className="flex h-screen">
      <main className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Main Content */}
        <div className={cn(
          "flex flex-col gap-6 p-4 md:p-6 transition-all duration-300",
          selectedTask ? "col-span-12 md:col-span-6 lg:col-span-7" : "col-span-12"
        )}>
          <TasksHeader 
            currentDate={currentDate}
            onDateChange={handleDateChange}
          />
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            <div className="border-y">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Назва</TableHead>
                            <TableHead className="hidden md:table-cell w-[180px]">Тип</TableHead>
                            <TableHead className="hidden sm:table-cell w-[100px]">Очік. час</TableHead>
                            <TableHead className="hidden sm:table-cell w-[100px]">Факт. час</TableHead>
                            <TableHead className="w-[120px] text-right">Дії</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map(task => (
                            <TaskItem 
                                key={task.id}
                                task={task} 
                                onSelect={() => handleTaskSelect(task)}
                                onUpdate={handleTaskUpdate}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
             <Input 
                ref={newTaskInputRef}
                placeholder="Нова задача..." 
                className="bg-card mt-2"
                onKeyDown={handleNewTaskKeyDown}
             />
          </div>
        </div>

        {/* Right Column / Details Panel */}
        <div className={cn(
            "transition-all duration-300",
            selectedTask ? "col-span-12 md:col-span-6 lg:col-span-5" : "hidden"
        )}>
             {selectedTask && (
                <TaskDetailsPanel 
                    task={selectedTask}
                    onUpdate={handleTaskUpdate}
                    onClose={handleClosePanel}
                />
            )}
        </div>
      </main>

      {/* FAB */}
      <Button 
        onClick={handleFabClick}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20"
      >
        <Plus className="h-8 w-8" />
        <span className="sr-only">Створити задачу</span>
      </Button>
    </div>
  );
}
