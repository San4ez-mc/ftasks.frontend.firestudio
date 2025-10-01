
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Loader2, Sparkles } from 'lucide-react';
import TaskItem from '@/components/tasks/task-item';
import TaskDetailsPanel from '@/components/tasks/task-details-panel';
import TasksHeader from '@/components/tasks/tasks-header';
import ResultsList from '@/components/tasks/results-list';
import type { Task, TaskType } from '@/types/task';
import type { Employee } from '@/types/company';
import { getTasksForDate, createTask, updateTask, deleteTask } from './actions';
import { getEmployees, getCurrentEmployee } from '@/app/(app)/company/actions';
import { parseTime, formatTime } from '@/lib/timeUtils';
import { useToast } from '@/hooks/use-toast';
import { suggestTaskPriorities } from '@/ai/flows/ai-task-prioritization';
import type { TaskPrioritizationOutput } from '@/ai/types';

export default function TasksPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'mine' | 'delegated' | 'subordinates'>('mine');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isPending, startTransition] = useTransition();
  const [prioritizationSuggestions, setPrioritizationSuggestions] = useState<TaskPrioritizationOutput>([]);
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
      const [user, allEmployees] = await Promise.all([
        getCurrentEmployee(),
        getEmployees()
      ]);
      setCurrentUser(user);
      setEmployees(allEmployees);
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      const dateString = currentDate.toISOString().split('T')[0];
      startTransition(async () => {
        const fetchedTasks = await getTasksForDate(dateString, currentUser.id, activeTab);
        setTasks(fetchedTasks);
      });
    }
  }, [currentDate, currentUser, activeTab]);

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleCreateTask = (title: string, resultContext?: {name: string, parentName: string}) => {
    if (!currentUser) return;
    const newTaskData: Omit<Task, 'id' | 'companyId'> = {
      title,
      dueDate: currentDate.toISOString().split('T')[0],
      status: 'todo',
      type: 'important-not-urgent',
      expectedTime: 30,
      assignee: { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}` },
      reporter: { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}` },
      resultName: resultContext ? `${resultContext.parentName} / ${resultContext.name}` : undefined,
    };

    startTransition(async () => {
        const newTask = await createTask(newTaskData);
        setTasks(prev => [...prev, newTask]);
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    startTransition(async () => {
        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
        }
        await updateTask(updatedTask.id, updatedTask);
    });
  }

  const handleDeleteTask = (taskId: string) => {
      setTasks(tasks.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) {
          setSelectedTask(null);
      }
  }

  const getPriorities = async () => {
    startTransition(async () => {
        try {
            const aiTasks = tasks.map(t => ({
                id: t.id,
                description: t.title,
                deadline: t.dueDate,
            }));
            const suggestions = await suggestTaskPriorities({ tasks: aiTasks, overallGoal: 'Закрити всі задачі якомога швидше' });
            setPrioritizationSuggestions(suggestions);
            toast({ title: 'AI-пропозиції готові!', description: 'Оптимальний порядок задач позначено.'});
        } catch (error) {
            toast({ title: 'Помилка AI', description: 'Не вдалося отримати пропозиції.', variant: 'destructive'});
        }
    });
  }
  
  const totalExpectedTime = tasks.reduce((sum, task) => sum + (task.expectedTime || 0), 0);
  const totalTimeStr = formatTime(totalExpectedTime);
  const workloadColor = totalExpectedTime > 480 ? 'text-red-500' : totalExpectedTime > 360 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="flex h-full">
      <main className="flex-1 flex flex-col p-4 md:p-6">
        <TasksHeader 
            currentDate={currentDate} 
            onDateChange={handleDateChange}
            activeTab={activeTab}
            onTabChange={setActiveTab as (tab: string) => void}
        />
        {totalExpectedTime > 360 && (
             <Card className={`my-4 border-yellow-500/50 ${workloadColor}`}>
                <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5"/>
                        <div>
                             <p className="font-bold text-sm">Увага, високе навантаження!</p>
                            <p className="text-xs">Запланований час на задачі: {totalTimeStr}</p>
                        </div>
                    </div>
                </CardContent>
             </Card>
        )}
        <div className="flex-1 overflow-y-auto mt-4">
            {isPending && tasks.length === 0 ? <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> :
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Стан</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead className="hidden md:table-cell">Тип</TableHead>
                  <TableHead className={cn("hidden sm:table-cell", selectedTask && "hidden")}>План. час</TableHead>
                  <TableHead className={cn("hidden sm:table-cell", selectedTask && "hidden")}>Факт. час</TableHead>
                  <TableHead className={cn("text-right", selectedTask && "hidden")}>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => {
                    const suggestion = prioritizationSuggestions.find(p => p.taskId === task.id);
                    return (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onSelect={() => setSelectedTask(task)}
                            onUpdate={handleUpdateTask}
                            onDelete={handleDeleteTask}
                            showTypeColumn={activeTab === 'mine'}
                            panelOpen={!!selectedTask}
                        />
                    )
                })}
              </TableBody>
            </Table>
            }
        </div>
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Нова задача..."
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                handleCreateTask(e.currentTarget.value.trim());
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </main>
      
      <aside className={cn("w-full md:w-2/5 lg:w-1/3 xl:w-1/4 bg-card border-l flex flex-col transition-all duration-300 ease-in-out", selectedTask ? "translate-x-0" : "translate-x-full absolute right-0 h-full")}>
        {selectedTask && <TaskDetailsPanel task={selectedTask} onUpdate={handleUpdateTask} onClose={() => setSelectedTask(null)} onDelete={handleDeleteTask} allEmployees={employees} />}
      </aside>

       {!selectedTask && (
            <aside className="w-full md:w-80 bg-card border-l p-4 hidden lg:flex flex-col gap-4">
                <Button onClick={getPriorities} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    AI-пріоритети
                </Button>
                <ResultsList onResultClick={handleCreateTask} />
            </aside>
       )}
    </div>
  );
}
