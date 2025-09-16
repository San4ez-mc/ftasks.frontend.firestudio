
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Users, Settings, Trash2, X, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { Instruction, InstructionAccess } from '@/types/instruction';
import { updateInstruction } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Employee } from '@/types/company';

type InstructionEditorProps = {
  instruction: Instruction;
  allEmployees: Employee[];
};

export default function InstructionEditor({ instruction: initialInstruction, allEmployees }: InstructionEditorProps) {
  const router = useRouter();
  const [instruction, setInstruction] = useState<Instruction>(initialInstruction);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const allUsers = allEmployees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, avatar: e.avatar }));

  useEffect(() => {
    setInstruction(initialInstruction);
  }, [initialInstruction]);

  const handleFieldChange = (field: keyof Instruction, value: any) => {
      setInstruction(prev => ({...prev, [field]: value}));
  }

  const handleSave = async () => {
      setIsSaving(true);
      try {
        await updateInstruction(instruction.id, instruction);
        toast({ title: "Успіх", description: "Інструкцію збережено." });
      } catch (error) {
        toast({ title: "Помилка", description: "Не вдалося зберегти інструкцію.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
  }

  const handleAccessChange = (selectedUsers: {id: string, name: string}[]) => {
      const newAccessList = selectedUsers.map(u => ({ userId: u.id, access: 'view' as const }));
      handleFieldChange('accessList', newAccessList);
  }


  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/instructions')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={instruction.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="text-lg font-bold tracking-tight font-headline border-none shadow-none p-0 h-auto focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              <Save className="mr-2 h-4 w-4" /> Зберегти
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/instructions')}><X className="h-4 w-4" /></Button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8">
            {/* This is a placeholder for a rich text editor like Tiptap or TinyMCE */}
            <Textarea 
                className="w-full h-full min-h-[60vh] text-base"
                value={instruction.content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder="Почніть писати інструкцію тут..."
            />
        </div>
      </div>
      
      {/* Right Panel: Settings */}
      <aside className="w-full md:w-80 bg-card border-l p-6 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-5 w-5"/>
                    Налаштування
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <label htmlFor="department" className="text-sm font-medium">Відділ</label>
                    <Input id="department" value={instruction.department} onChange={(e) => handleFieldChange('department', e.target.value)} />
                 </div>
                 <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4"/> Видалити інструкцію
                 </Button>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5"/>
                    Доступи
                </CardTitle>
            </CardHeader>
            <CardContent>
                <AccessListCombobox 
                    allUsers={allUsers}
                    selectedUsers={instruction.accessList.map(item => {
                        const user = allUsers.find(u => u.id === item.userId);
                        return user || { id: item.userId, name: 'Unknown User', avatar: ''};
                    })}
                    onSelectionChange={handleAccessChange}
                />
            </CardContent>
        </Card>
      </aside>
    </div>
  );
}


function AccessListCombobox({ allUsers, selectedUsers, onSelectionChange }: { 
    allUsers: {id: string, name: string, avatar: string}[], 
    selectedUsers: {id: string, name: string, avatar: string}[], 
    onSelectionChange: (users: {id: string, name: string}[]) => void 
}) {
    const [open, setOpen] = useState(false);
    
    const handleSelect = (user: {id: string, name: string}) => {
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
