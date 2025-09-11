
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2, X, Clock, Link as LinkIcon, CalendarDays, Repeat } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from './actions';
import { getResults } from '../results/actions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types/template';
import type { Result } from '@/types/result';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';


// --- TOUR STEPS ---

const templatesTourSteps: TourStep[] = [
    {
        elementId: 'active-templates-list',
        title: 'Список активних шаблонів',
        content: 'Тут знаходяться всі ваші активні шаблони. Натисніть на будь-який, щоб переглянути та відредагувати його деталі в панелі праворуч.',
        placement: 'bottom'
    },
    {
        elementId: 'create-from-result-list',
        title: 'Створити з результату',
        content: 'Використовуйте цей блок, щоб швидко створити новий шаблон на основі існуючого результату. Це зручно для автоматизації звітів.',
        placement: 'bottom'
    },
    {
        elementId: 'create-template-fab',
        title: 'Створити новий шаблон',
        content: 'Натисніть цю кнопку, щоб створити новий шаблон з нуля, вказавши його назву, періодичність та очікуваний результат.',
        placement: 'left'
    },
    {
        elementId: 'template-details-panel',
        title: 'Деталі шаблону',
        content: 'Після вибору шаблону тут з\'являється панель з детальною інформацією. Ви можете редагувати налаштування та переглядати історію згенерованих задач.',
        placement: 'left'
    },
];

type Recurrence = {
  type: 'daily' | 'weekly' | 'monthly' | 'interval';
  interval: number; // For "every N days"
  daysOfWeek: number[]; // 0 for Sunday, 1 for Monday...
  dayOfMonth: number; // 1-31
};

const weekDays = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatRepeatability(recurrence: Recurrence): string {
    switch (recurrence.type) {
        case 'daily':
            return 'Щоденно';
        case 'weekly':
            if (recurrence.daysOfWeek.length === 7) return 'Щоденно';
            if (recurrence.daysOfWeek.length === 0) return 'Щотижня';
            return `Щотижня (${recurrence.daysOfWeek.map(d => weekDays[d]).join(', ')})`;
        case 'monthly':
            return `Щомісяця (${recurrence.dayOfMonth} числа)`;
        case 'interval':
             return `Кожні ${recurrence.interval} дні`;
        default:
            return 'Не налаштовано';
    }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState<{name: string, resultId?: string, resultName?: string}>({name: ''});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
        const [fetchedTemplates, fetchedResults] = await Promise.all([
            getTemplates(),
            getResults()
        ]);
        setTemplates(fetchedTemplates);
        setResults(fetchedResults);
    });
  }, []);


  const handleCreateTemplate = (templateData: Omit<Template, 'id'>) => {
    startTransition(async () => {
        try {
            const created = await createTemplate(templateData);
            setTemplates(prev => [created, ...prev]);
            setSelectedTemplate(created);
            setIsCreateDialogOpen(false);
            setNewTemplateData({name: ''});
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося створити шаблон.", variant: "destructive" });
        }
    });
  };
  
  const handleUpdateTemplate = (updatedTemplate: Template) => {
    startTransition(async () => {
        // Optimistic UI update
        setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
        if (selectedTemplate?.id === updatedTemplate.id) {
            setSelectedTemplate(updatedTemplate);
        }
        try {
            await updateTemplate(updatedTemplate.id, updatedTemplate);
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося оновити шаблон.", variant: "destructive" });
            const fetched = await getTemplates();
            setTemplates(fetched);
        }
    });
  }

  const handleDeleteTemplate = (templateId: string) => {
    startTransition(async () => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        if (selectedTemplate?.id === templateId) {
            setSelectedTemplate(null);
        }
        try {
            await deleteTemplate(templateId);
            toast({ title: "Успіх", description: "Шаблон видалено." });
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося видалити шаблон.", variant: "destructive" });
            const fetched = await getTemplates();
            setTemplates(fetched);
        }
    });
  };

  const handleCreateFromRes = (resultId: string) => {
      let linkedResult: {id: string, name: string} | null = null;
      for (const res of results) {
          if (res.id === resultId) {
              linkedResult = {id: res.id, name: res.name};
              break;
          }
          const subRes = res.subResults.find(sr => sr.id === resultId);
          if (subRes) {
              linkedResult = {id: subRes.id, name: `${res.name} / ${subRes.name}`};
              break;
          }
      }
      if(linkedResult) {
        setNewTemplateData({name: linkedResult.name, resultId: linkedResult.id, resultName: linkedResult.name});
        setIsCreateDialogOpen(true);
      }
  }
  
  const handleClosePanel = () => {
    setSelectedTemplate(null);
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        <InteractiveTour pageKey="templates" steps={templatesTourSteps} />
      <div className={cn(
        "flex flex-col transition-all duration-300 w-full",
        selectedTemplate ? "md:w-1/2 lg:w-3/5" : "w-full"
      )}>
        <main className="flex-1 flex flex-col gap-6 p-4 md:p-6 overflow-y-auto">
            <header>
                <h1 className="text-xl font-bold tracking-tight font-headline text-center mb-4">Шаблони</h1>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card id="active-templates-list">
                    <CardHeader>
                        <CardTitle>Активні шаблони</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isPending ? <p>Завантаження...</p> : templates.map(template => (
                             <Card 
                                key={template.id} 
                                className={cn(
                                    "cursor-pointer hover:shadow-md transition-shadow group/item",
                                    selectedTemplate?.id === template.id && "ring-2 ring-primary"
                                )}
                                onClick={() => setSelectedTemplate(template)}
                            >
                                <CardContent className="p-3">
                                    {template.resultName && <p className="text-xs text-muted-foreground mb-1">{template.resultName}</p>}
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-sm">{template.name}</span>
                                        <div className="flex items-center">
                                            <Badge variant="outline" className="text-xs">{template.repeatability}</Badge>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/item:opacity-100" onClick={e => e.stopPropagation()}>
                                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Ви впевнені?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogDescription>Це назавжди видалить шаблон "{template.name}".</AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>Видалити</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
                <Card id="create-from-result-list">
                    <CardHeader>
                        <CardTitle>Створити з результату</CardTitle>
                        <CardDescription>Клікніть щоб створити шаблон</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       {results.length > 0 ? results.map(result => (
                           <div key={result.id}>
                               {result.subResults && result.subResults.length > 0 ? (
                                   result.subResults.map(subResult => (
                                     <div key={subResult.id} onClick={() => handleCreateFromRes(subResult.id)} className="p-3 rounded-md border hover:bg-accent cursor-pointer mb-2">
                                       <p className="font-medium text-sm">{subResult.name}</p>
                                       <p className="text-xs text-muted-foreground">{result.name}</p>
                                     </div>
                                   ))
                               ) : (
                                    <div onClick={() => handleCreateFromRes(result.id)} className="p-3 rounded-md border hover:bg-accent cursor-pointer">
                                        <p className="font-medium text-sm">{result.name}</p>
                                    </div>
                               )}
                           </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center p-4">Результати не очікуються</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
      </div>
      
      <div id="template-details-panel" className={cn(
        "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden w-full md:w-0",
        selectedTemplate ? "md:w-1/2 lg:w-2/5" : "hidden"
      )}>
        {selectedTemplate && <TemplateDetailsPanel key={selectedTemplate.id} template={selectedTemplate} onUpdate={handleUpdateTemplate} onClose={handleClosePanel} onDelete={handleDeleteTemplate} />}
      </div>


      {/* FAB and Create Dialog */}
      <CreateTemplateDialog 
        isOpen={isCreateDialogOpen} 
        setIsOpen={setIsCreateDialogOpen} 
        results={results}
        initialData={newTemplateData}
        onCreate={handleCreateTemplate}
      />
    </div>
  );
}

// --- Create Dialog ---
function CreateTemplateDialog({isOpen, setIsOpen, results, initialData, onCreate}: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    results: Result[];
    initialData: {name: string, resultId?: string, resultName?: string};
    onCreate: (templateData: Omit<Template, 'id'>) => void;
}) {
    const [name, setName] = useState('');
    const [linkedResultId, setLinkedResultId] = useState<string | undefined>(initialData.resultId);
    const [expectedResult, setExpectedResult] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [recurrence, setRecurrence] = useState<Recurrence>({
        type: 'daily',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 1,
    });
    
    useEffect(() => {
        setName(initialData.name || '');
        setLinkedResultId(initialData.resultId);
    }, [initialData]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const selectedResult = results.flatMap(r => [r, ...r.subResults]).find(item => item.id === linkedResultId);
        
        onCreate({
            name,
            repeatability: formatRepeatability(recurrence),
            startDate: (startDate || new Date()).toISOString().split('T')[0],
            tasksGenerated: [],
            expectedResult,
            resultId: linkedResultId,
            resultName: selectedResult?.name
        });
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button id="create-template-fab" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="templateName" className="flex items-center gap-2"><Edit className="h-4 w-4"/>Назва шаблону</Label>
                        <Input id="templateName" name="templateName" value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                         <Label htmlFor="resultId" className="flex items-center gap-2"><LinkIcon className="h-4 w-4"/>Прив'язка до результату (опціонально)</Label>
                         <Select value={linkedResultId} onValueChange={setLinkedResultId}>
                            <SelectTrigger id="resultId"><SelectValue placeholder="Обрати результат..." /></SelectTrigger>
                            <SelectContent>
                                 <SelectItem value="none">Без прив'язки</SelectItem>
                                {results.map(res => (
                                     <SelectGroup key={res.id}>
                                        <SelectLabel>{res.name}</SelectLabel>
                                        {res.subResults && res.subResults.length > 0 ? (
                                            res.subResults.map(sub => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)
                                        ) : (
                                            <SelectItem value={res.id}>{res.name}</SelectItem>
                                        )}
                                     </SelectGroup>
                                ))}
                            </SelectContent>
                         </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="startDate" className="flex items-center gap-2"><CalendarDays className="h-4 w-4"/>Дата старту</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <span>{startDate ? formatDate(startDate) : "Обрати дату"}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus/>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                         <Label htmlFor="recurrenceType" className="flex items-center gap-2"><Repeat className="h-4 w-4"/>Повторюваність</Label>
                         <Select value={recurrence.type} onValueChange={(v: Recurrence['type']) => setRecurrence(r => ({...r, type: v}))}>
                            <SelectTrigger id="recurrenceType"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Щоденно</SelectItem>
                                <SelectItem value="weekly">Щотижня</SelectItem>
                                <SelectItem value="monthly">Щомісяця</SelectItem>
                                <SelectItem value="interval">Через N днів</SelectItem>
                            </SelectContent>
                         </Select>
                         {recurrence.type === 'weekly' && (
                             <div className="flex justify-center gap-1 pt-2">
                                {weekDays.map((day, index) => (
                                    <Button 
                                        key={day} 
                                        type="button"
                                        variant={recurrence.daysOfWeek.includes(index) ? "secondary" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => setRecurrence(r => ({...r, daysOfWeek: r.daysOfWeek.includes(index) ? r.daysOfWeek.filter(d => d !== index) : [...r.daysOfWeek, index]}))}
                                    >{day}</Button>
                                ))}
                             </div>
                         )}
                         {recurrence.type === 'interval' && (
                             <div className="flex items-center gap-2 pt-2">
                                <span>Повторювати кожні</span>
                                <Input type="number" value={recurrence.interval} onChange={e => setRecurrence(r => ({...r, interval: parseInt(e.target.value, 10) || 1}))} className="w-20" />
                                <span>дні(в)</span>
                             </div>
                         )}
                         {recurrence.type === 'monthly' && (
                              <div className="flex items-center gap-2 pt-2">
                                <span>Повторювати</span>
                                <Input type="number" value={recurrence.dayOfMonth} onChange={e => setRecurrence(r => ({...r, dayOfMonth: parseInt(e.target.value, 10) || 1}))} className="w-20" min="1" max="31"/>
                                <span>числа кожного місяця</span>
                             </div>
                         )}
                    </div>
                     
                     <div className="space-y-2">
                        <Label htmlFor="expectedResult">Очікуваний результат</Label>
                        <Textarea id="expectedResult" name="expectedResult" value={expectedResult} onChange={e => setExpectedResult(e.target.value)} />
                    </div>

                    <DialogFooter>
                        <Button type="submit">Зберегти шаблон</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// --- Details Panel ---

function TemplateDetailsPanel({ template, onUpdate, onClose, onDelete }: { template: Template, onUpdate: (template: Template) => void, onClose: () => void, onDelete: (id: string) => void }) {
    
    const handleFieldChange = (field: keyof Template, value: string) => {
        onUpdate({ ...template, [field]: value });
    }
    
    return (
        <div className="flex flex-col h-full">
             <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                <div>
                    {template.resultName && <p className="text-xs text-muted-foreground">{template.resultName}</p>}
                    <h2 className="text-lg font-semibold font-headline">{template.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Основна інформація</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <Label htmlFor="template-name">Назва шаблону</Label>
                            <Input id="template-name" value={template.name} onChange={e => handleFieldChange('name', e.target.value)} />
                        </div>
                         <div>
                            <Label htmlFor="startDate">Дата старту</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                                        <CalendarDays className="mr-2 h-4 w-4"/>
                                        <span>{template.startDate ? formatDate(template.startDate) : "Обрати дату"}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar 
                                        mode="single" 
                                        selected={new Date(template.startDate)} 
                                        onSelect={(date) => handleFieldChange('startDate', date?.toISOString().split('T')[0] || '')}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="template-repeatability">Повторюваність</Label>
                            <Input id="template-repeatability" value={template.repeatability} onChange={e => handleFieldChange('repeatability', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="template-expected-result">Очікуваний результат</Label>
                            <Textarea id="template-expected-result" value={template.expectedResult} onChange={e => handleFieldChange('expectedResult', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Історія</CardTitle>
                        <CardDescription>Автоматично згенеровані задачі</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {template.tasksGenerated.map(task => (
                            <div key={task.id} className="flex justify-between items-center text-sm p-2 border rounded-md">
                                <span>Задача від {formatDate(task.date)}</span>
                                <Badge variant={task.status === 'done' ? 'secondary' : 'default'}>
                                    {task.status === 'done' ? 'Виконано' : 'В роботі'}
                                </Badge>
                            </div>
                        ))}
                         {template.tasksGenerated.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">Задачі ще не генерувалися.</p>
                        )}
                    </CardContent>
                </Card>
                 <Separator />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Clock className="mr-2 h-4 w-4" /> Призупинити</Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(template.id)}><Trash2 className="mr-2 h-4 w-4"/> Видалити</Button>
                </div>
            </div>
        </div>
    )
}
