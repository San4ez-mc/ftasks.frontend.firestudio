
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Edit, Trash2, X, Clock } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types/template';


const initialResults = [
    { id: '1', name: 'Конверсія з сайту', value: '12%' },
    { id: '2', name: 'Залучено нових клієнтів', value: '84' },
    { id: '3', name: 'Середній час відповіді', value: '2.5 год' },
];


// --- TOUR STEPS ---

const templatesTourSteps: TourStep[] = [
    {
        elementId: 'active-templates-list',
        title: 'Список активних шаблонів',
        content: 'Тут знаходяться всі ваші активні шаблони. Натисніть на будь-який, щоб переглянути та відредагувати його деталі в панелі праворуч.',
    },
    {
        elementId: 'create-from-result-list',
        title: 'Створити з результату',
        content: 'Використовуйте цей блок, щоб швидко створити новий шаблон на основі існуючого результату. Це зручно для автоматизації звітів.',
    },
    {
        elementId: 'create-template-fab',
        title: 'Створити новий шаблон',
        content: 'Натисніть цю кнопку, щоб створити новий шаблон з нуля, вказавши його назву, періодичність та очікуваний результат.',
    },
    {
        elementId: 'template-details-panel',
        title: 'Деталі шаблону',
        content: 'Після вибору шаблону тут з\'являється панель з детальною інформацією. Ви можете редагувати налаштування та переглядати історію згенерованих задач.',
    },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
        const fetchedTemplates = await getTemplates();
        setTemplates(fetchedTemplates);
    });
  }, []);


  const handleCreateTemplate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('templateName') as string;
    if (name) {
        const newTemplateData: Omit<Template, 'id'> = {
            name,
            repeatability: formData.get('repeatability') as string,
            startDate: new Date().toISOString().split('T')[0],
            tasksGenerated: [],
            expectedResult: formData.get('expectedResult') as string
        };
        startTransition(async () => {
            try {
                const created = await createTemplate(newTemplateData);
                setTemplates(prev => [created, ...prev]);
                setSelectedTemplate(created);
                setIsCreateDialogOpen(false);
                setNewTemplateName('');
            } catch (error) {
                toast({ title: "Помилка", description: "Не вдалося створити шаблон.", variant: "destructive" });
            }
        });
    }
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
      const result = initialResults.find(r => r.id === resultId);
      if(result) {
        setNewTemplateName(result.name);
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
                                    "cursor-pointer hover:shadow-md transition-shadow",
                                    selectedTemplate?.id === template.id && "ring-2 ring-primary"
                                )}
                                onClick={() => setSelectedTemplate(template)}
                            >
                                <CardContent className="p-3 flex justify-between items-center">
                                    <span className="font-medium text-sm">{template.name}</span>
                                    <Badge variant="outline" className="text-xs">{template.repeatability}</Badge>
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
                        {initialResults.map(result => (
                            <div key={result.id} onClick={() => handleCreateFromRes(result.id)} className="p-3 rounded-md border hover:bg-accent cursor-pointer">
                                <p className="font-medium text-sm">{result.name}</p>
                                <p className="text-xs text-muted-foreground">{result.value}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </main>
      </div>
      
      <div id="template-details-panel" className={cn(
        "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden w-full md:w-0",
        selectedTemplate ? "md:w-1/2 lg:w-2/5" : "hidden"
      )}>
        {selectedTemplate && <TemplateDetailsPanel key={selectedTemplate.id} template={selectedTemplate} onUpdate={handleUpdateTemplate} onDelete={handleDeleteTemplate} onClose={handleClosePanel} />}
      </div>


      {/* FAB and Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                <form onSubmit={handleCreateTemplate}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="templateName" className="text-right">Назва</Label>
                            <Input id="templateName" name="templateName" className="col-span-3" defaultValue={newTemplateName || ''}/>
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

// --- Details Panel ---

function TemplateDetailsPanel({ template, onUpdate, onClose, onDelete }: { template: Template, onUpdate: (template: Template) => void, onClose: () => void, onDelete: (id: string) => void }) {
    
    const handleFieldChange = (field: keyof Template, value: string) => {
        onUpdate({ ...template, [field]: value });
    }
    
    return (
        <div className="flex flex-col h-full">
             <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                <h2 className="text-lg font-semibold font-headline">{template.name}</h2>
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
