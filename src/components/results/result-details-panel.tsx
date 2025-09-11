
'use client';
import type { Result, SubResult, User, ResultComment } from '@/types/result';
import type { Task, TaskType } from '@/types/task';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MoreVertical, Paperclip, Send, Calendar as CalendarIcon, Edit, PlusCircle, Trash2, X, FilePlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createTask as createTaskAction } from '@/app/(app)/tasks/actions';
import { useToast } from '@/hooks/use-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { companyEmployees } from '@/lib/db';


type ResultDetailsPanelProps = {
  result: Result;
  onUpdate: (result: Result) => void;
  onClose: () => void;
  onDelete: (resultId: string) => void;
};

const mockUsers: User[] = companyEmployees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, avatar: e.avatar }));


const typeOptions: { value: TaskType; label: string; color: string }[] = [
  { value: 'important-urgent', label: 'Важлива, термінова', color: 'bg-red-500' },
  { value: 'important-not-urgent', label: 'Важлива, нетермінова', color: 'bg-blue-500' },
  { value: 'not-important-urgent', label: 'Неважлива, термінова', color: 'bg-purple-500' },
  { value: 'not-important-not-urgent', label: 'Неважлива, нетермінова', color: 'bg-yellow-600' },
];


export default function ResultDetailsPanel({ result, onUpdate, onClose, onDelete }: ResultDetailsPanelProps) {
    const [localResult, setLocalResult] = useState(result);
    const nameInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const lastAddedSubResultId = useRef<string | null>(null);
    const subResultInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        setLocalResult(result);
        // Focus the input when the panel opens for a new result or a different result.
        // Use a timeout to ensure the element is rendered and visible before focusing.
        setTimeout(() => {
            nameInputRef.current?.focus();
            // If it's a new result, select the text for easy replacement
            if (result.name === '') {
                nameInputRef.current?.select();
            }
        }, 100); 
    }, [result]);
    
    useEffect(() => {
        if (lastAddedSubResultId.current && subResultInputRefs.current[lastAddedSubResultId.current]) {
            subResultInputRefs.current[lastAddedSubResultId.current]?.focus();
            lastAddedSubResultId.current = null;
        }
    }, [localResult.subResults]);


    const handleFieldChange = (field: keyof Result, value: any) => {
        const updatedResult = { ...localResult, [field]: value };
        setLocalResult(updatedResult);
    }
    
    const handleBlur = (field: keyof Result) => {
        if(localResult[field] !== result[field]){
            onUpdate(localResult);
        }
    }

    const handleSubResultsChange = (updatedSubResults: SubResult[]) => {
        setLocalResult(prev => ({...prev, subResults: updatedSubResults}));
    }

    const handleSubResultsBlur = () => {
        onUpdate(localResult);
    }
     
    const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
        try {
            const newTask = await createTaskAction(taskData);
            const newResultTask = { id: newTask.id, title: newTask.title, status: newTask.status };
            onUpdate({ ...result, tasks: [...result.tasks, newResultTask] });
            toast({
                title: "Успіх!",
                description: `Задача "${newTask.title}" створена.`,
            });
        } catch(error) {
             toast({
                title: "Помилка!",
                description: "Не вдалося створити задачу.",
                variant: "destructive"
            });
        }
    }
    
     const handleCreateTemplate = () => {
        const newTemplate = {
            id: `tpl-${Date.now()}`,
            name: result.name,
            repeatability: 'Щоденно',
        };
        onUpdate({ ...result, templates: [...result.templates, newTemplate] });
    }
    
    const handleAccessListChange = (selectedUsers: User[]) => {
        onUpdate({ ...result, accessList: selectedUsers });
    }

    return (
        <div className="flex flex-col h-full bg-card text-sm">
            <header className="p-4 border-b flex items-center gap-2 sticky top-0 bg-card z-10">
                <Input 
                    ref={nameInputRef}
                    value={localResult.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    onKeyDown={(e) => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    placeholder="Назва результату"
                    className={cn(
                        "text-base font-semibold flex-1 p-0 border-none focus-visible:ring-0 shadow-none h-auto", 
                        result.completed && "line-through text-muted-foreground"
                    )}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <DialogAddTask result={result} onTaskCreate={handleCreateTask} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCreateTemplate}>Створити шаблон</DropdownMenuItem>
                        <DropdownMenuItem>Дублювати</DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">Видалити</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Цю дію неможливо скасувати. Це назавжди видалить результат "{result.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(result.id)}>Видалити</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </header>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Details Section */}
                 <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-muted-foreground mb-1">Дедлайн</p>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-8 text-xs font-normal w-full justify-start">
                                    <CalendarIcon className="mr-2 h-3 w-3"/>
                                    {formatDate(result.deadline)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={new Date(result.deadline)}
                                    onSelect={(date) => onUpdate({...result, deadline: date?.toISOString().split('T')[0] || result.deadline})}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div>
                        <p className="text-muted-foreground mb-1">Статус</p>
                         <Select value={result.status} onValueChange={(status) => onUpdate({...result, status})}>
                            <SelectTrigger className="h-8 text-xs">
                                 <SelectValue />
                            </SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="В роботі">В роботі</SelectItem>
                                 <SelectItem value="Заплановано">Заплановано</SelectItem>
                                 <SelectItem value="Виконано">Виконано</SelectItem>
                                 <SelectItem value="Відкладено">Відкладено</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Select 
                            value={result.assignee.id} 
                            onValueChange={(userId) => {
                                const user = mockUsers.find(u => u.id === userId);
                                if (user) onUpdate({...result, assignee: user})
                            }}>
                            <SelectTrigger className="h-8 text-xs w-auto border-none p-0 focus:ring-0">
                                <SelectValue asChild>
                                    <Avatar className="h-8 w-8 cursor-pointer"><AvatarImage src={result.assignee.avatar} /></Avatar>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {mockUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                         <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /></Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div>
                            <p className="font-medium">{result.assignee.name}</p>
                            <p className="text-xs text-muted-foreground">Відповідальний</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 text-right">
                         <div>
                            <p className="font-medium">{result.reporter.name}</p>
                            <p className="text-xs text-muted-foreground">Постановник</p>
                        </div>
                        <Avatar className="h-8 w-8"><AvatarImage src={result.reporter.avatar} /></Avatar>
                    </div>
                </div>

                <div>
                    <Label htmlFor="description" className="text-xs text-muted-foreground">Опис результату</Label>
                    <p className="text-xs text-muted-foreground/70 mb-1">Той результат детально, який постановник хоче отримати</p>
                    <Textarea 
                        id="description" 
                        value={localResult.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        onBlur={() => handleBlur('description')} 
                        className="mt-1 bg-transparent border-dashed text-xs min-h-[60px]"
                        placeholder="Опишіть, що має бути зроблено..."
                    />
                </div>
                
                {/* Access List */}
                <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-2 mb-2"><Users className="h-4 w-4"/> Доступи</Label>
                    <AccessListCombobox
                        allUsers={mockUsers}
                        selectedUsers={result.accessList || []}
                        onSelectionChange={handleAccessListChange}
                    />
                </div>


                {/* File attachments */}
                <div>
                     <Label className="text-xs text-muted-foreground">Прикріплені файли</Label>
                     <div className="mt-2">
                         <Button variant="outline" size="sm" className="text-xs h-8 w-full">
                            <Paperclip className="mr-2 h-3 w-3"/> Додати файл
                         </Button>
                     </div>
                </div>

                <Separator />

                {/* Sub-results */}
                <div>
                    <h3 className="font-semibold text-xs mb-2">Підрезультати</h3>
                    <SubResultList 
                        subResults={localResult.subResults}
                        onSubResultsChange={handleSubResultsChange}
                        onBlur={handleSubResultsBlur}
                        lastAddedIdRef={lastAddedSubResultId}
                        inputRefs={subResultInputRefs}
                    />
                </div>

                 {/* Tasks */}
                <div>
                    <h3 className="font-semibold text-xs mb-2">Задачі</h3>
                    <div className="space-y-2">
                         {result.tasks.map(task => (
                             <div key={task.id} className="flex items-center gap-2 p-1 rounded text-xs border">
                               <Checkbox checked={task.status === 'done'}/>
                               <p className="flex-1">{task.title}</p>
                            </div>
                        ))}
                         <DialogAddTask result={result} onTaskCreate={handleCreateTask} triggerButton />
                    </div>
                </div>
                
                 {/* Templates */}
                <div>
                    <h3 className="font-semibold text-xs mb-2">Шаблони</h3>
                    <div className="space-y-2">
                         {result.templates.map(template => (
                             <Card key={template.id} className="text-xs p-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">{template.name}</p>
                                     <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3"/></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdate({...result, templates: result.templates.filter(t => t.id !== template.id)})}>
                                            <Trash2 className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>
                                 {template.repeatability && (
                                     <div className="mt-2">
                                        <Label className="text-muted-foreground">Повторюваність</Label>
                                        <Input 
                                            className="h-7 mt-1 text-xs" 
                                            defaultValue={template.repeatability}
                                            onChange={(e) => {
                                                const updatedTemplates = result.templates.map(t => t.id === template.id ? {...t, repeatability: e.target.value} : t);
                                                onUpdate({...result, templates: updatedTemplates});
                                            }}
                                        />
                                     </div>
                                 )}

                            </Card>
                        ))}
                         <Button onClick={handleCreateTemplate} variant="outline" size="sm" className="w-full text-xs h-8"><FilePlus className="mr-2 h-3 w-3"/> Створити шаблон</Button>
                    </div>
                </div>

                 {/* Comments */}
                 <div>
                    <h3 className="font-semibold text-xs mb-2">Коментарі</h3>
                    <div className="space-y-4">
                        {result.comments?.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8"><AvatarImage src={comment.author.avatar} /></Avatar>
                                <div>
                                    <p className="font-medium text-xs">{comment.author.name} <span className="text-xs text-muted-foreground ml-2">{comment.timestamp}</span></p>
                                    <p className="text-xs bg-muted p-2 rounded-md mt-1">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

            </div>
            <footer className="p-4 border-t bg-background mt-auto">
                <div className="relative">
                    <Textarea placeholder="Додати коментар..." className="pr-20 text-xs"/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
                        <Button size="icon"><Send className="h-4 w-4" /></Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// --- SubResult Components ---

type SubResultListProps = {
    subResults: SubResult[];
    onSubResultsChange: (subResults: SubResult[]) => void;
    onBlur: () => void;
    lastAddedIdRef: React.MutableRefObject<string | null>;
    inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
    level?: number;
}

function SubResultList({ subResults, onSubResultsChange, onBlur, lastAddedIdRef, inputRefs, level = 0 }: SubResultListProps) {
    const handleAddSubResult = (parentSubResultId?: string) => {
        const newSubResult: SubResult = {
            id: `sub-${Date.now()}`,
            name: '',
            completed: false,
            assignee: mockUsers[0],
            deadline: new Date().toISOString().split('T')[0],
        };
        lastAddedIdRef.current = newSubResult.id;

        const addRecursively = (items: SubResult[]): SubResult[] => {
            if (!parentSubResultId) return [...items, newSubResult];
            return items.map(item => {
                if (item.id === parentSubResultId) {
                    return { ...item, subResults: [...(item.subResults || []), newSubResult] };
                }
                if (item.subResults) {
                    return { ...item, subResults: addRecursively(item.subResults) };
                }
                return item;
            });
        };

        onSubResultsChange(addRecursively(subResults));
    };

    const handleChange = (id: string, field: keyof SubResult, value: any) => {
        const changeRecursively = (items: SubResult[]): SubResult[] => {
            return items.map(item => {
                if (item.id === id) {
                    return { ...item, [field]: value };
                }
                if (item.subResults) {
                    return { ...item, subResults: changeRecursively(item.subResults) };
                }
                return item;
            });
        };
        onSubResultsChange(changeRecursively(subResults));
    };
    
    const handleDelete = (id: string) => {
        const deleteRecursively = (items: SubResult[]): SubResult[] => {
            return items.filter(item => {
                if(item.id === id) return false;
                if(item.subResults) {
                    item.subResults = deleteRecursively(item.subResults);
                }
                return true;
            })
        }
        onSubResultsChange(deleteRecursively(subResults));
        onBlur();
    }


    return (
        <div className="space-y-2">
            {subResults.map(sr => (
                <div key={sr.id} style={{ paddingLeft: `${level > 0 ? 1 : 0}rem` }}>
                    <div className="flex flex-col gap-2 p-2 border rounded-md group/sub-result">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={sr.completed}
                                onCheckedChange={(checked) => {
                                    handleChange(sr.id, 'completed', !!checked);
                                    onBlur();
                                }}
                            />
                            <Input
                                ref={el => { inputRefs.current[sr.id] = el }}
                                value={sr.name}
                                onChange={(e) => handleChange(sr.id, 'name', e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') handleAddSubResult(sr.id)}}
                                onBlur={onBlur}
                                placeholder="Новий підрезультат..."
                                className="h-7 text-xs border-none focus-visible:ring-1 flex-1"
                            />
                             {level < 4 && (
                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/sub-result:opacity-100" onClick={() => handleAddSubResult(sr.id)}>
                                    <PlusCircle className="h-3 w-3" />
                                </Button>
                             )}
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/sub-result:opacity-100" onClick={() => handleDelete(sr.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between pl-6">
                            <Select 
                                value={sr.assignee?.id}
                                onValueChange={(userId) => {
                                    const user = mockUsers.find(u => u.id === userId);
                                    if(user) {
                                        handleChange(sr.id, 'assignee', user);
                                        onBlur();
                                    }
                                }}>
                                <SelectTrigger className="h-7 text-xs w-auto border-none p-0 focus:ring-0">
                                    <SelectValue asChild>
                                        <Avatar className="h-5 w-5 cursor-pointer"><AvatarImage src={sr.assignee?.avatar} /></Avatar>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {mockUsers.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /></Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-7 text-xs font-normal p-1">
                                        <CalendarIcon className="mr-1 h-3 w-3"/>
                                        {sr.deadline ? formatDate(sr.deadline) : 'Дата'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={sr.deadline ? new Date(sr.deadline) : undefined}
                                        onSelect={(date) => {
                                            handleChange(sr.id, 'deadline', date?.toISOString().split('T')[0]);
                                            onBlur();
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    {sr.subResults && sr.subResults.length > 0 && (
                        <SubResultList 
                            subResults={sr.subResults}
                            onSubResultsChange={(updated) => handleChange(sr.id, 'subResults', updated)}
                            onBlur={onBlur}
                            level={level + 1}
                            lastAddedIdRef={lastAddedIdRef}
                            inputRefs={inputRefs}
                        />
                    )}
                </div>
            ))}
            {level === 0 && (
                 <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => handleAddSubResult()}>
                    <PlusCircle className="mr-2 h-3 w-3"/> Додати підрезультат
                </Button>
            )}
        </div>
    )
}


// Helper component for Add Task Dialog
function DialogAddTask({ result, onTaskCreate, triggerButton = false }: { result: Result; onTaskCreate: (taskData: Omit<Task, 'id'>) => void, triggerButton?: boolean }) {
    const [title, setTitle] = useState(result.name);
    const [assigneeId, setAssigneeId] = useState(result.assignee.id);
    const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
    const [type, setType] = useState<TaskType>('important-not-urgent');

    const handleSubmit = () => {
        const assignee = mockUsers.find(u => u.id === assigneeId) || result.assignee;
        
        onTaskCreate({
            title,
            assignee,
            dueDate: (dueDate || new Date()).toISOString().split('T')[0],
            type,
            reporter: result.reporter, // Or current user
            status: 'todo',
            expectedTime: 30, // Default value
            resultId: result.id,
            resultName: result.name,
        });
    };

    const Trigger = triggerButton ? (
        <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-xs h-8"><PlusCircle className="mr-2 h-3 w-3"/> Додати задачу</Button>
        </DialogTrigger>
    ) : (
        <DialogTrigger className="w-full text-left">Створити задачу</DialogTrigger>
    );

    return (
        <Dialog>
            {Trigger}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Створити нову задачу</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="space-y-1">
                        <Label htmlFor="task-title">Назва</Label>
                        <Input id="task-title" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label>Відповідальний</Label>
                        <Select value={assigneeId} onValueChange={setAssigneeId}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {mockUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-1">
                        <Label>Дата виконання</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="font-normal w-full justify-start">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? formatDate(dueDate) : <span>Обрати дату</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus/>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-1">
                        <Label>Тип задачі</Label>
                        <Select value={type} onValueChange={(v: TaskType) => setType(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {typeOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <Badge className={cn("text-xs", opt.color)}>{opt.label}</Badge>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Скасувати</Button>
                    </DialogClose>
                     <DialogClose asChild>
                        <Button type="submit" onClick={handleSubmit}>Створити</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AccessListCombobox({ allUsers, selectedUsers, onSelectionChange }: { allUsers: User[], selectedUsers: User[], onSelectionChange: (users: User[]) => void }) {
    const [open, setOpen] = useState(false);
    
    const handleSelect = (user: User) => {
        const isSelected = selectedUsers.some(su => su.id === user.id);
        if (isSelected) {
            onSelectionChange(selectedUsers.filter(su => su.id !== user.id));
        } else {
            onSelectionChange([...selectedUsers, user]);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-auto min-h-10">
                    <div className="flex flex-wrap gap-1">
                        {selectedUsers.length > 0 ? selectedUsers.map(user => (
                            <Badge key={user.id} variant="secondary" className="gap-1">
                                <Avatar className="h-5 w-5"><AvatarImage src={user.avatar} /></Avatar>
                                {user.name}
                                <button onClick={(e) => { e.stopPropagation(); handleSelect(user);}} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                    <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                        )) : "Надати доступ..."}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Пошук співробітника..." />
                    <CommandList>
                        <CommandEmpty>Не знайдено.</CommandEmpty>
                        <CommandGroup>
                            {allUsers.map(user => (
                                <CommandItem key={user.id} onSelect={() => handleSelect(user)} value={user.name}>
                                    <Checkbox className="mr-2" checked={selectedUsers.some(su => su.id === user.id)} />
                                    <Avatar className="h-6 w-6 mr-2"><AvatarImage src={user.avatar} /></Avatar>
                                    <span>{user.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
