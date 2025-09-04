
'use client';
import type { Task, TaskStatus, TaskType } from "@/types/task";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type TaskItemProps = {
    task: Task;
    onSelect: () => void;
    onUpdate: (task: Task) => void;
};

const typeColors: Record<TaskType, string> = {
    'important-urgent': 'bg-red-500 hover:bg-red-600',
    'important-not-urgent': 'bg-blue-500 hover:bg-blue-600',
    'not-important-urgent': 'bg-purple-500 hover:bg-purple-600',
    'not-important-not-urgent': 'bg-yellow-600 hover:bg-yellow-700 text-background',
};

const typeLabels: Record<TaskType, string> = {
    'important-urgent': 'Важлива, термінова',
    'important-not-urgent': 'Важлива, нетермінова',
    'not-important-urgent': 'Неважлива, термінова',
    'not-important-not-urgent': 'Неважлива, нетермінова',
};

function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

export default function TaskItem({ task, onSelect, onUpdate }: TaskItemProps) {
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

    const handleCheckedChange = (checked: boolean | 'indeterminate') => {
        if (checked) {
            setIsCompleteDialogOpen(true);
        } else {
            onUpdate({ ...task, status: 'todo' });
        }
    };

    const handleCompleteTask = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const actualResult = formData.get('actualResult') as string;
        const actualTime = formData.get('actualTime') as string;
        
        onUpdate({
            ...task,
            status: 'done',
            actualResult,
            actualTime: parseInt(actualTime, 10)
        });
        setIsCompleteDialogOpen(false);
    };

    return (
        <div 
            className={cn(
                "flex items-center gap-3 p-1 rounded-md transition-colors",
                task.status === 'done' ? 'bg-muted/50' : 'hover:bg-accent'
            )}
        >
            <Checkbox 
                id={`task-${task.id}`} 
                checked={task.status === 'done'}
                onCheckedChange={handleCheckedChange}
                className="mt-1"
            />
            <div className="flex-1 cursor-pointer text-sm" onClick={onSelect}>
                <p className={cn(
                    "truncate",
                    task.status === 'done' && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </p>
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge className={cn("hidden sm:inline-flex text-xs", typeColors[task.type])}>{typeLabels[task.type]}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{typeLabels[task.type]}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <span className="text-xs text-muted-foreground hidden md:inline">{formatTime(task.expectedTime)}</span>
            
            <Avatar className="h-6 w-6 hidden sm:flex">
                <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} data-ai-hint="person" />
                <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hidden sm:flex">
                <CalendarIcon className="h-4 w-4" />
            </Button>

            <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Завершення задачі: {task.title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCompleteTask}>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="actualResult">Фактичний результат</Label>
                            <Textarea id="actualResult" name="actualResult" defaultValue={task.expectedResult} />
                            
                            <Label htmlFor="actualTime">Фактичний час (хв)</Label>
                            <Input id="actualTime" name="actualTime" type="number" defaultValue={task.expectedTime} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsCompleteDialogOpen(false)}>Скасувати</Button>
                            <Button type="submit">OK</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
