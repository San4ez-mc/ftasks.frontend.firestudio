
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

const initialTemplates = [
  { 
    id: '1', 
    name: 'Щоденний звіт', 
    repeatability: 'Щоденно', 
    startDate: '2024-08-01',
    tasksGenerated: [
        { id: 't1-1', date: '2024-08-01', status: 'done'},
        { id: 't1-2', date: '2024-08-02', status: 'done'},
        { id: 't1-3', date: '2024-08-03', status: 'todo'},
    ]
  },
  { 
    id: '2', 
    name: 'Щотижнева аналітика', 
    repeatability: 'Щотижня (Пн)', 
    startDate: '2024-07-29',
    tasksGenerated: [
        { id: 't2-1', date: '2024-07-29', status: 'done'},
        { id: 't2-2', date: '2024-08-05', status: 'todo'},
    ]
  },
  { 
    id: '3', 
    name: 'Підготовка до щомісячної зустрічі', 
    repeatability: 'Щомісяця (25 число)', 
    startDate: '2024-06-25',
    tasksGenerated: [
        { id: 't3-1', date: '2024-06-25', status: 'done'},
        { id: 't3-2', date: '2024-07-25', status: 'done'},
    ]
  },
];

const initialResults = [
    { id: '1', name: 'Конверсія з сайту', value: '12%' },
    { id: '2', name: 'Залучено нових клієнтів', value: '84' },
    { id: '3', name: 'Середній час відповіді', value: '2.5 год' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const handleCreateTemplate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Logic to create a new template
    setIsDialogOpen(false);
  };

  const handleCreateFromRes = (resultId: string) => {
      const result = initialResults.find(r => r.id === resultId);
      if(result) {
        setSelectedResult(result.name);
        setIsDialogOpen(true);
      }
  }

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-4 md:p-6">
        {/* Main Content */}
        <div className="md:col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-center mb-4">Шаблони</h1>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Пошук шаблонів..." className="pl-10" />
                    </div>
                     <div className="flex gap-2 w-full sm:w-auto">
                        <Select>
                            <SelectTrigger className="flex-1 sm:w-[180px]">
                                <SelectValue placeholder="За типом" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="result">Результат</SelectItem>
                                <SelectItem value="task">Задача</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="flex-1 sm:w-[180px]">
                                <SelectValue placeholder="За автором" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="me">Мої</SelectItem>
                                <SelectItem value="ivan">Іван Петренко</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </div>
            </header>
            <Accordion type="single" collapsible className="w-full">
                {templates.map(template => (
                    <AccordionItem value={template.id} key={template.id}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                                <span className="font-medium text-left">{template.name}</span>
                                <Badge variant="outline" className="text-right whitespace-nowrap ml-2">{template.repeatability}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 bg-muted/50 rounded-md">
                            <p className="text-sm text-muted-foreground mb-2">Дата початку: {formatDate(template.startDate)}</p>
                             <h4 className="font-semibold mb-2">Згенеровані задачі:</h4>
                             <div className="space-y-1">
                                {template.tasksGenerated.map(task => (
                                    <div key={task.id} className="flex justify-between items-center text-sm p-1">
                                        <span>Задача від {formatDate(task.date)}</span>
                                        <Badge variant={task.status === 'done' ? 'secondary' : 'default'}>
                                            {task.status === 'done' ? 'Виконано' : 'В роботі'}
                                        </Badge>
                                    </div>
                                ))}
                             </div>
                             <div className="mt-4 flex gap-2 flex-wrap">
                                <Button size="sm">Редагувати</Button>
                                <Button size="sm" variant="outline">Вимкнути</Button>
                                <Button size="sm" variant="destructive">Видалити</Button>
                             </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>

        {/* Right Column */}
        <div className="md:col-span-12 lg:col-span-4 xl:col-span-3">
             <Card className="h-full">
                <CardHeader>
                    <CardTitle>Результати</CardTitle>
                    <CardDescription>Клікніть щоб створити шаблон</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {initialResults.map(result => (
                        <div key={result.id} onClick={() => handleCreateFromRes(result.id)} className="p-3 rounded-md border hover:bg-accent cursor-pointer">
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-muted-foreground">{result.value}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </main>

      {/* FAB */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
                    <PlusCircle className="h-8 w-8" />
                    <span className="sr-only">Створити шаблон</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Створити новий шаблон</DialogTitle>
                    <DialogDescription>
                        Створіть шаблон для автоматичної генерації повторюваних задач.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTemplate}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="templateName" className="text-right">Назва</Label>
                            <Input id="templateName" name="templateName" className="col-span-3" defaultValue={selectedResult || ''}/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="repeatability" className="text-right">Повторюваність</Label>
                            <Input id="repeatability" name="repeatability" className="col-span-3" placeholder="Наприклад, щодня о 9:00"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expectedResult" className="text-right">Очікуваний результат</Label>
                           <Textarea id="expectedResult" name="expectedResult" className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Зберегти шаблон</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
