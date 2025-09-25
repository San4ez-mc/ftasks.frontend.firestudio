
'use client';

import type { Task } from '@/types/task';
import type { Employee } from '@/types/company';
import { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import { Plus, AlertTriangle, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TasksHeader from '@/components/tasks/tasks-header';
import TaskItem from '@/components/tasks/task-item';
import { Input } from '@/components/ui/input';
import TaskDetailsPanel from '@/components/tasks/task-details-panel';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ResultsList from '@/components/tasks/results-list';
import type { Result } from '@/types/result';
import { formatTime } from '@/lib/timeUtils';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';
import { getTasksForDate, createTask, updateTask, deleteTask } from '@/app/(app)/tasks/actions';
import { getEmployees } from '@/app/(app)/company/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logout } from '@/lib/api';

// --- TOUR STEPS ---

const tasksTourSteps: TourStep[] = [
  {
    elementId: 'tasks-header',
    title: 'Навігація по датах та задачах',
    content: 'Перемикайтеся між датами, щоб переглянути задачі на конкретний день. Використовуйте вкладки для фільтрації задач (ваші, делеговані, підлеглих).',
    placement: 'bottom'
  },
  {
    elementId: 'tasks-table',
    title: 'Список щоденних задач',
    content: 'Тут відображаються ваші задачі на обраний день. Ви можете відзначати їх виконання, редагувати назву та бачити основну інформацію.',
    placement: 'bottom'
  },
  {
    elementId: 'new-task-input',
    title: 'Швидке створення задачі',
    content: 'Введіть назву нової задачі тут і натисніть Enter, щоб миттєво додати її до списку на сьогодні.',
    placement: 'top'
  },
  {
    elementId: 'results-panel',
    title: 'Створення задач з результатів',
    content: 'Ця панель показує ключові результати. Натисніть на будь-який результат, щоб швидко створити пов\'язану з ним задачу.',
    placement: 'left'
  },
  {
    elementId: 'task-details-panel',
    title: 'Панель деталей задачі',
    content: 'Клікніть на будь-яку задачу, щоб відкрити цю панель. Тут ви можете додати опис, встановити час, змінити відповідального та переглянути коментарі.',
    placement: 'left'
  },
];


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState('mine');
  const newTaskInputRef = useRef<HTMLInputElement>(null);
  const taskTitleInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);


  useEffect(() => {
    // Set the date only on the client side to avoid hydration mismatch
    setCurrentDate(new Date());
    
    startTransition(async () => {
        try {
            const fetchedEmployees = await getEmployees();
            const session = await getUserSession(); // Fetch session info which includes userId
            
            if (!session) {
                throw new Error("Session is invalid or expired.");
            }
            
            setEmployees(fetchedEmployees);
            const currentUserEmployee = fetchedEmployees.find(e => e.userId === session.userId);
            setCurrentUser(currentUserEmployee || null);
            
            if (!currentUserEmployee) {
                 throw new Error("User profile not found in company employees.");
            }

        } catch (error) {
            console.error("Failed to fetch initial page data", error);
            toast({
                title: "Помилка сесії",
                description: "Ваш профіль не знайдено або сесія застаріла. Будь ласка, увійдіть знову.",
                variant: "destructive",
            });
            // This is a critical session error, force logout to clear the bad cookie.
            logout();
        }
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentDate && currentUser) {
        startTransition(async () => {
            const fetchedTasks = await getTasksForDate(currentDate.toISOString().split('T')[0], currentUser.id, activeTab as any);
            setTasks(fetchedTasks);
        });
    }
  }, [currentDate, activeTab, currentUser]);

  useEffect(() => {
    if (selectedTask && taskTitleInputRef.current) {
        taskTitleInputRef.current.focus();
    }
  }, [selectedTask]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            const clickedOnTrigger = (event.target as HTMLElement).closest('.group');
            if (!clickedOnTrigger) {
                handleClosePanel();
            }
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    setSelectedTask(null);
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };
  
  const handleTaskUpdate = (updatedTask: Task) => {
     startTransition(async () => {
        const isAssigneeChanged = updatedTask.assignee?.id !== selectedTask?.assignee?.id;

        // Optimistic update
        setTasks(currentTasks => currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        if (selectedTask && selectedTask.id === updatedTask.id) {
            setSelectedTask(updatedTask);
        }
        
        try {
            await updateTask(updatedTask.id, updatedTask);
            if (isAssigneeChanged) {
                 toast({ title: "Відповідального змінено", description: `Задача "${updatedTask.title}" тепер призначена ${updatedTask.assignee.name}.` });
            }
        } catch (error) {
            // Revert on error
            toast({ title: "Помилка", description: "Не вдалося оновити задачу.", variant: "destructive" });
             if (currentDate && currentUser) {
                const fetchedTasks = await getTasksForDate(currentDate.toISOString().split('T')[0], currentUser.id, activeTab as any);
                setTasks(fetchedTasks);
            }
        }
    });
  }

  const handleTaskCreate = (taskData: Omit<Task, 'id' | 'companyId'>) => {
      startTransition(async () => {
        try {
            const createdTask = await createTask(taskData);
            setTasks(prevTasks => [createdTask, ...prevTasks]);
            setSelectedTask(createdTask);
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося створити задачу.", variant: "destructive" });
        }
    });
  }

  const handleTaskDelete = (taskId: string) => {
    startTransition(async () => {
        try {
            await deleteTask(taskId);
            setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
            if (selectedTask?.id === taskId) {
                setSelectedTask(null);
            }
            toast({ title: "Успіх", description: "Задачу видалено." });
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося видалити задачу.", variant: "destructive" });
        }
    });
  };

  const createNewTask = (title: string, resultName?: string) => {
    if(!currentUser) return;
    const newTaskData: Omit<Task, 'id' | 'companyId'> = {
      title: title,
      dueDate: (currentDate || new Date()).toISOString().split('T')[0],
      status: 'todo',
      type: 'important-not-urgent', // Default type
      expectedTime: 30, // Default time
      description: '',
      expectedResult: 'Очікуваний результат генерується GPT',
      assignee: { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, avatar: currentUser.avatar },
      reporter: { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, avatar: currentUser.avatar },
      resultName: resultName,
    };
    handleTaskCreate(newTaskData);
  };

  const handleResultClick = (result: {name: string, parentName: string}) => {
    createNewTask(result.name, result.parentName);
  };

  const handleNewTaskKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const inputElement = event.currentTarget;
      const title = inputElement.value.trim();
      if (title) {
        createNewTask(title);
        inputElement.value = '';
      }
    }
  };

  const handleFabClick = () => {
    createNewTask('');
    setTimeout(() => {
        const openTask = tasks.find(t => t.title === '');
        if(openTask) {
           setSelectedTask(openTask);
        }
    }, 100);
  };
  
  const handleClosePanel = () => {
    const taskToClose = selectedTask;
    setSelectedTask(null);

    // If the task being closed has an empty title, delete it
    if (taskToClose && taskToClose.title.trim() === '') {
        handleTaskDelete(taskToClose.id);
    }
  };
  
  const panelOpen = !!selectedTask;

  const { totalExpectedTime, totalActualTime, filteredTasks } = useMemo(() => {
    let filtered = tasks;
     if (currentUser && activeTab) {
        switch(activeTab) {
            case 'delegated':
                filtered = tasks.filter(t => t.reporter?.id === currentUser.id && t.assignee?.id !== currentUser.id);
                break;
            case 'subordinates':
                filtered = tasks.filter(t => t.reporter?.id !== currentUser.id && t.assignee?.id !== currentUser.id);
                break;
            case 'mine':
            default:
                filtered = tasks.filter(t => t.assignee?.id === currentUser.id);
                break;
        }
    }

    const totals = filtered.reduce(
      (acc, task) => {
        if (task.status !== 'done') {
          acc.totalExpectedTime += task.expectedTime || 0;
        }
        acc.totalActualTime += task.actualTime || 0;
        return acc;
      },
      { totalExpectedTime: 0, totalActualTime: 0 }
    );
    return { ...totals, filteredTasks: filtered };
  }, [tasks, activeTab, currentUser]);
  
  const groupedTasks = useMemo(() => {
    if (activeTab === 'mine') {
        const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Мої задачі';
        return { [currentUser?.id || 'current-user']: { name, results: filteredTasks } };
    }
    return filteredTasks.reduce((acc, task) => {
        const key = task.assignee.id || 'unassigned';
        if (!acc[key]) {
            acc[key] = { ...task.assignee, results: [] };
        }
        acc[key].results.push(task);
        return acc;
      }, {} as Record<string, { id?: string, name: string; avatar?: string; results: Task[] }>);

  }, [filteredTasks, activeTab, currentUser]);
  
  const totalExpectedHours = totalExpectedTime / 60;
  
  const showTypeColumn = useMemo(() => activeTab === 'mine' && !panelOpen, [activeTab, panelOpen]);


  const WorkloadAlert = () => {
    if (activeTab !== 'mine' || totalExpectedHours <= 6) return null;

    if (totalExpectedHours > 8) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Надмірне навантаження!</AlertTitle>
          <AlertDescription>
            Заплановано роботи на {formatTime(totalExpectedTime)}. Ви ризикуєте не встигнути все виконати. Рекомендуємо перенести частину задач на інший день.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (totalExpectedHours > 6) {
      return (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Високе навантаження</AlertTitle>
          <AlertDescription>
            На сьогодні заплановано {formatTime(totalExpectedTime)} роботи. Це щільний графік, тому будь-яка нова термінова задача може порушити ваші плани.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };
  
  if (!currentDate) {
    return null; // or a loading skeleton
  }


  return (
    <div ref={containerRef} className="flex flex-col md:flex-row h-screen">
      <InteractiveTour pageKey="tasks" steps={tasksTourSteps} />
      <main className={cn(
        "flex-1 flex transition-all duration-300 w-full",
        panelOpen ? "md:w-1/2" : "md:w-3/4"
      )}>
        {/* Main Content */}
        <div className="flex flex-col p-2 md:p-4 w-full">
          <TasksHeader 
            id="tasks-header"
            currentDate={currentDate}
            onDateChange={handleDateChange}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="flex-1 flex flex-col gap-1 overflow-y-auto pt-2">
            <div className="px-1">
                <WorkloadAlert />
            </div>
            <div className="border-t" id="tasks-table">
                 {isPending && <div>Завантаження...</div>}
                 {!isPending && Object.values(groupedTasks).map(group => (
                    <div key={group.id || group.name}>
                        {activeTab !== 'mine' && (
                            <div className="flex items-center gap-3 p-2 border-b bg-muted/50">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={group.avatar} />
                                    <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold">{group.name}</h3>
                            </div>
                        )}
                        <Table>
                            {activeTab === 'mine' && (
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Назва</TableHead>
                                        <TableHead className={cn("hidden md:table-cell w-[180px]", panelOpen && "hidden")}>Тип</TableHead>
                                        <TableHead className={cn("hidden sm:table-cell w-[100px]", panelOpen && "hidden")}>Очік. час</TableHead>
                                        <TableHead className={cn("hidden sm:table-cell w-[100px]", panelOpen && "hidden")}>Факт. час</TableHead>
                                        <TableHead className={cn("w-[120px] text-right", panelOpen && "hidden")}>Дії</TableHead>
                                    </TableRow>
                                </TableHeader>
                            )}
                            <TableBody>
                                {group.results.map(task => (
                                    <TaskItem 
                                        key={task.id}
                                        task={task} 
                                        onSelect={() => handleTaskSelect(task)}
                                        onUpdate={handleTaskUpdate}
                                        onDelete={handleTaskDelete}
                                        showTypeColumn={activeTab === 'mine' && !panelOpen}
                                        panelOpen={panelOpen}
                                    />
                                ))}
                            </TableBody>
                             {activeTab === 'mine' && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={ showTypeColumn ? 3 : 2 } className="font-bold">Всього</TableCell>
                                        <TableCell className={cn("font-bold text-xs", panelOpen && "hidden")}>{formatTime(totalExpectedTime)}</TableCell>
                                        <TableCell className={cn("font-bold text-xs", panelOpen && "hidden")}>{formatTime(totalActualTime)}</TableCell>
                                        <TableCell className={cn(panelOpen && "hidden")}></TableCell>
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                    </div>
                ))}
            </div>
             <Input 
                id="new-task-input"
                ref={newTaskInputRef}
                placeholder="Нова задача..." 
                className="bg-card mt-auto rounded-none"
                onKeyDown={handleNewTaskKeyDown}
             />
          </div>
        </div>
        
        {/* Results Panel */}
        <aside id="results-panel" className={cn(
            "w-full md:w-1/4 p-4 border-l transition-all duration-300",
            panelOpen ? 'hidden' : 'hidden md:block'
        )}>
            <ResultsList onResultClick={handleResultClick} />
        </aside>
      </main>

       {/* Details Panel */}
      <div id="task-details-panel" className={cn(
          "transition-all duration-300 w-full md:w-0",
          panelOpen ? "md:w-1/2" : "hidden"
      )}>
            {selectedTask && (
              <TaskDetailsPanel 
                  task={selectedTask}
                  onUpdate={handleTaskUpdate}
                  onClose={handleClosePanel}
                  onDelete={handleTaskDelete}
                  allEmployees={employees}
              />
          )}
      </div>

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

    