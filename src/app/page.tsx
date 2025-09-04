'use client';

import type { Task, TaskPrioritizationOutput } from '@/ai/flows/ai-task-prioritization';
import { useState, useTransition } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getTaskPriorities } from '@/app/actions';
import { Loader2, Wand2, MoveVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const initialTasks: Task[] = [
  { id: '1', description: 'Розробити API для авторизації', deadline: '2024-08-15', isGoal: false },
  { id: '2', description: 'Створити UI/UX для сторінки задач', deadline: '2024-08-20', isGoal: false },
  { id: '3', description: 'Налаштувати інтеграцію з Telegram', isGoal: true },
  { id: '4', description: 'Підготувати презентацію для клієнта', deadline: '2024-08-10', isGoal: false },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [overallGoal, setOverallGoal] = useState('Запустити MVP продукту до кінця кварталу');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [suggestions, setSuggestions] = useState<TaskPrioritizationOutput>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: (tasks.length + 1).toString(),
        description: newTask.trim(),
        deadline: date ? date.toISOString().split('T')[0] : undefined,
      };
      setTasks(prev => [...prev, task]);
      setNewTask('');
      toast({
        title: 'Задачу додано',
        description: `Нову задачу "${task.description}" було успішно додано.`,
      });
    }
  };

  const handleGetPriorities = () => {
    startTransition(async () => {
      const result = await getTaskPriorities(tasks, overallGoal);
      if (result.success && result.data) {
        setSuggestions(result.data);
        setIsSuggestionsOpen(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Помилка',
          description: result.error || 'Не вдалося отримати пріоритети.',
        });
      }
    });
  };
  
  const getSuggestionForTask = (taskId: string) => {
    return suggestions.find(s => s.taskId === taskId);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Мої задачі</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Додати нову задачу</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Опис задачі..."
                  rows={4}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Вибрана дата: {date ? date.toLocaleDateString('uk-UA') : 'Не вибрано'}</p>
                    <div className="flex gap-2">
                        <Button variant="outline">Скасувати</Button>
                        <Button onClick={handleAddTask}>Зберегти задачу</Button>
                    </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Календар</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        />
                    </CardContent>
                </Card>
                <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Wand2 className="text-primary" />
                    AI Пріоритезація
                    </CardTitle>
                    <CardDescription>Отримайте рекомендації щодо пріоритетів</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <label htmlFor="overallGoal" className="text-sm font-medium">Загальна мета</label>
                    <Input
                        id="overallGoal"
                        value={overallGoal}
                        onChange={(e) => setOverallGoal(e.target.value)}
                        placeholder="Наприклад, запустити MVP..."
                    />
                    </div>
                    <Button onClick={handleGetPriorities} disabled={isPending} className="w-full">
                    {isPending ? <Loader2 className="animate-spin" /> : 'Запропонувати пріоритети'}
                    </Button>
                </CardContent>
                </Card>
            </div>
        </div>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Задачі на сьогодні</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.length > 0 ? (
              tasks.map(task => {
                const suggestion = getSuggestionForTask(task.id);
                return (
                  <Card key={task.id} className={`p-4 ${suggestion ? 'border-primary' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{task.description}</p>
                        <p className="text-sm text-muted-foreground">{task.deadline ? `До: ${task.deadline}` : 'Без терміну'}</p>
                        {suggestion && <p className="text-xs text-primary mt-1">AI: {suggestion.priorityReason}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoveVertical className="w-4 h-4" />
                        <span className="sr-only">Перенести на іншу дату</span>
                      </Button>
                    </div>
                  </Card>
                )
              })
            ) : (
              <p className="text-muted-foreground text-center py-8">Немає задач на сьогодні.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>AI Рекомендації по пріоритетам</DialogTitle>
            <DialogDescription>
              Ось рекомендований порядок виконання задач для досягнення вашої мети. Зміни виділено у списку задач.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.taskId}>
                <p className="font-bold">{index+1}. {tasks.find(t=>t.id === suggestion.taskId)?.description}</p>
                <p className="text-sm text-muted-foreground pl-4">{suggestion.priorityReason}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
