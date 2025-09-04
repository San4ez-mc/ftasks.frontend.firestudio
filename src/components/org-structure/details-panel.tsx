
'use client';

import React, { useState, useEffect } from 'react';
import type { Position, Employee } from '@/types/org-structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, UserPlus, Workflow, ClipboardList } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandItem, CommandEmpty, CommandGroup, CommandList } from '@/components/ui/command';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface DetailsPanelProps {
  position: Position;
  allEmployees: Employee[];
  onUpdate: (position: Position) => void;
  onClose: () => void;
}

export default function DetailsPanel({ position, allEmployees, onUpdate, onClose }: DetailsPanelProps) {
  const [formData, setFormData] = useState(position);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (JSON.stringify(formData) !== JSON.stringify(position)) {
        onUpdate(formData);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [formData, onUpdate, position]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEmployeeToggle = (employeeId: string) => {
    setFormData(prev => {
        const employeeIds = prev.employeeIds.includes(employeeId)
            ? prev.employeeIds.filter(id => id !== employeeId)
            : [...prev.employeeIds, employeeId];
        return { ...prev, employeeIds };
    });
  };

  const assignedEmployees = allEmployees.filter(e => formData.employeeIds.includes(e.id));

  return (
    <div className="flex flex-col h-full bg-card">
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
            <h2 className="text-lg font-semibold font-headline">Деталі посади</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            <div>
                <Label htmlFor="name">Назва посади</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1"/>
            </div>
             <div>
                <Label htmlFor="description">Ролі/Відповідальність</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="mt-1 min-h-[80px]"/>
            </div>

            <Separator />

            <div>
                <Label>Співробітники</Label>
                <div className="mt-2 space-y-2">
                    {assignedEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8"><AvatarImage src={emp.avatar} /><AvatarFallback>{emp.name.charAt(0)}</AvatarFallback></Avatar>
                                <span>{emp.name}</span>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleEmployeeToggle(emp.id)}><X className="h-4 w-4"/></Button>
                        </div>
                    ))}
                </div>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-2"><UserPlus className="mr-2 h-4 w-4"/>Прив'язати співробітника</Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]">
                        <Command>
                            <CommandInput placeholder="Пошук співробітника..."/>
                            <CommandList>
                                <CommandEmpty>Не знайдено.</CommandEmpty>
                                <CommandGroup>
                                    {allEmployees.map(emp => (
                                        <CommandItem 
                                            key={emp.id}
                                            onSelect={() => handleEmployeeToggle(emp.id)}
                                            className="flex justify-between items-center"
                                        >
                                            {emp.name}
                                            <div className={cn("mr-2 h-4 w-4 rounded-sm border", formData.employeeIds.includes(emp.id) ? "bg-primary" : "opacity-50")}/>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            
            <Separator />

            <div>
                <Label>Прив'язки</Label>
                <div className="space-y-2 mt-2">
                    <Button variant="outline" className="w-full justify-start"><Workflow className="mr-2 h-4 w-4"/> Прив'язати процеси</Button>
                    <Button variant="outline" className="w-full justify-start"><ClipboardList className="mr-2 h-4 w-4"/> Прив'язати KPI</Button>
                </div>
            </div>
        </div>
    </div>
  );
}
