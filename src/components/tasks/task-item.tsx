
'use client';
import type { Task, TaskStatus, TaskType } from "@/types/task";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Edit, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TableRow, TableCell } from "@/components/ui/table";

type TaskItemProps = {
    task: Task;
    onSelect: () => void;
    onUpdate: (task: Task) => void;
    showTypeColumn: boolean;
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
    if (!minutes && minutes !== 0) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hStr = h > 0 ? `${h}h` : '';
    const mStr = m > 0 ? `${m}m` : '';
    return `${hStr} ${mStr}`.trim() || '0m';
}

export default function TaskItem({ task, onSelect, onUpdate, showTypeColumn }: TaskItemProps) {
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [actualTime, setActualTime] = useState(task.actualTime);
    
    useEffect(() => {
        setTitle(task.title);
        setActualTime(task.actualTime);
    }, [task]);

    const handleCheckedChange = (checked: boolean | 'indeterminate') => {
        if (checked && task.status !== 'done') {
            setIsCompleteDialogOpen(true);
        } else {
            onUpdate({ ...task, status: 'todo' });
        }
    };

    const handleCompleteTask = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const actualResult = formData.get('actualResult') as string;
        const actualTimeValue = formData.get('actualTime') as string;
        
        onUpdate({
            ...task,
            status: 'done',
            actualResult,
            actualTime: parseInt(actualTimeValue, 10)
        });
        setIsCompleteDialogOpen(false);
    };

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            onUpdate({ ...task, dueDate: date.toISOString().split('T')[0] });
        }
    };

    const handleTitleBlur = () => {
        if (title.trim() && title !== task.title) {
            onUpdate({ ...task, title });
        } else {
            setTitle(task.title);
        }
    };

    const handleActualTimeBlur = () => {
        const newTime = actualTime === undefined ? undefined : Number(actualTime);
        if (newTime !== task.actualTime) {
            onUpdate({ ...task, actualTime: newTime });
        }
    };

    return (
        <>
        <TableRow className="group">
            <TableCell>
                 <Checkbox 
                    id={`task-${task.id}`} 
                    checked={task.status === 'done'}
                    onCheckedChange={handleCheckedChange}
                    className="mt-1"
                />
            </TableCell>
             <TableCell className="font-medium">
                {task.resultName && <p className="text-xs text-muted-foreground cursor-pointer" onClick={onSelect}>{task.resultName}</p>}
                 <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    className={cn(
                        "h-auto p-0 border-none focus-visible:ring-0 shadow-none bg-transparent",
                        task.status === 'done' && "line-through text-muted-foreground"
                    )}
                />
            </TableCell>
            <TableCell className={cn(!showTypeColumn && "hidden", "md:table-cell")}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge className={cn("text-xs", typeColors[task.type])}>{typeLabels[task.type]}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{typeLabels[task.type]}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-xs">{formatTime(task.expectedTime)}</TableCell>
            <TableCell className="hidden sm:table-cell text-xs">
                <Input
                    type="number"
                    value={actualTime ?? ''}
                    onChange={(e) => setActualTime(e.target.value ? Number(e.target.value) : undefined)}
                    onBlur={handleActualTimeBlur}
                    placeholder="-"
                    className="h-7 w-20 text-xs border-none focus-visible:ring-1 bg-transparent"
                />
            </TableCell>
             <TableCell className="text-right">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSelect} title="Редагувати"><Edit className="h-3 w-3"/></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Відкласти"><Clock className="h-3 w-3"/></Button>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <CalendarIcon className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={new Date(task.dueDate)}
                                onSelect={handleDateChange}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3"/></Button>
                </div>
            </TableCell>
        </TableRow>

        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Завершення задачі: {task.title}</DialogTitle>
                     <DialogDescription>
                        Заповніть фактичні результати для завершення задачі.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCompleteTask}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="actualResult">Фактичний результат</Label>
                            <Textarea id="actualResult" name="actualResult" defaultValue={task.expectedResult} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="actualTime">Фактичний час (хв)</Label>
                            <Input id="actualTime" name="actualTime" type="number" defaultValue={task.expectedTime} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => {
                            setIsCompleteDialogOpen(false);
                            onUpdate({ ...task, status: 'todo' }); // Revert checkbox state
                        }}>Скасувати</Button>
                        <Button type="submit">OK</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    )
}
