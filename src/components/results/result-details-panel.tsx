
'use client';
import type { Result } from '@/types/result';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FilePlus, Clock, MoreVertical, Paperclip, Send, Calendar as CalendarIcon, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';

type ResultDetailsPanelProps = {
  result: Result;
  onUpdate: (result: Result) => void;
  isCreating?: boolean;
};

const mockUsers = [
  { name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
  { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
  { name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
  { name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
];


export default function ResultDetailsPanel({ result, onUpdate, isCreating = false }: ResultDetailsPanelProps) {
    const [name, setName] = useState(result.name);

    useEffect(() => {
        setName(result.name)
    }, [result.name])

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        onUpdate({...result, name: e.target.value});
    }
    
    return (
        <div className="flex flex-col h-full bg-card border-l text-sm">
            <header className="p-4 border-b">
                <div className="flex items-start gap-3">
                    <Checkbox id={`res-check-${result.id}`} className="mt-1" checked={result.completed} onCheckedChange={(checked) => onUpdate({...result, completed: !!checked})} />
                     <Input 
                        value={name}
                        onChange={handleNameChange}
                        autoFocus={isCreating}
                        placeholder="Назва результату"
                        className={cn("text-lg font-semibold flex-1 p-0 border-none focus-visible:ring-0 shadow-none h-auto", result.completed && "line-through text-muted-foreground")}
                    />
                    <Button variant="ghost" size="icon"><FilePlus className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Clock className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </div>
            </header>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Details Section */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <p className="text-muted-foreground mb-1">Відповідальний</p>
                         <Select defaultValue={result.assignee.name}>
                            <SelectTrigger className="h-8 text-xs">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6"><AvatarImage src={result.assignee.avatar} /></Avatar>
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {mockUsers.map(user => (
                                    <SelectItem key={user.name} value={user.name}>
                                         <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /></Avatar>
                                            <span>{user.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <p className="text-muted-foreground mb-1">Постановник</p>
                        <div className="flex items-center gap-2 h-8">
                            <Avatar className="h-6 w-6"><AvatarImage src={result.reporter.avatar} /></Avatar>
                            <span>{result.reporter.name}</span>
                        </div>
                    </div>
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
                        <Badge variant={result.completed ? 'secondary' : 'default'} className="h-8 flex items-center">{result.completed ? 'Виконано' : result.status}</Badge>
                    </div>
                </div>
                <div>
                    <Label htmlFor="description" className="text-xs text-muted-foreground">Очікуваний результат</Label>
                    <p className="text-xs text-muted-foreground/70 mb-1">Той результат детально, який постановник хоче отримати</p>
                    <Textarea id="description" defaultValue={result.description} onBlur={(e) => onUpdate({...result, description: e.target.value})} className="mt-1 bg-transparent border-dashed text-xs"/>
                </div>

                <Separator />

                 {/* Tasks */}
                <div>
                    <h3 className="font-semibold text-xs mb-2">Задачі</h3>
                    <div className="space-y-2">
                         {result.tasks.map(task => (
                             <div key={task.id} className="flex items-center gap-2 p-1 rounded text-xs border">
                               <p className="flex-1">{task.title}</p>
                               <Badge variant={task.status === 'done' ? 'secondary' : 'default'}>
                                   {task.status === 'done' ? 'Виконано' : 'В роботі'}
                                </Badge>
                            </div>
                        ))}
                         <Button variant="outline" size="sm" className="w-full text-xs h-8"><PlusCircle className="mr-2 h-3 w-3"/> Створити задачу</Button>
                    </div>
                </div>
                
                 {/* Templates */}
                <div>
                    <h3 className="font-semibold text-xs mb-2">Шаблони</h3>
                    <div className="space-y-2">
                         {result.templates.map(template => (
                             <div key={template.id} className="flex items-center gap-2 p-1 rounded text-xs border">
                               <p className="flex-1">{template.name}</p>
                               <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3"/></Button>
                               <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3"/></Button>
                            </div>
                        ))}
                         <Button variant="outline" size="sm" className="w-full text-xs h-8"><FilePlus className="mr-2 h-3 w-3"/> Створити шаблон</Button>
                    </div>
                </div>

                 {/* Comments */}
                 <div>
                    <h3 className="font-semibold text-xs mb-2">Коментарі</h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src={result.reporter.avatar} /></Avatar>
                            <div>
                                <p className="font-medium text-xs">{result.reporter.name} <span className="text-xs text-muted-foreground ml-2">2 години тому</span></p>
                                <p className="text-xs bg-muted p-2 rounded-md mt-1">Не забудьте перевірити бюджети перед запуском.</p>
                            </div>
                        </div>
                    </div>
                 </div>

            </div>
            <footer className="p-4 border-t bg-background">
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
