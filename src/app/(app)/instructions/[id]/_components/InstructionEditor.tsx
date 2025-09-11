
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Users, Settings, Eye, Trash2, X, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { Instruction } from '@/types/instruction';
import { updateInstruction } from '../../actions';
import { useToast } from '@/hooks/use-toast';


type InstructionEditorProps = {
  instruction: Instruction;
};

export default function InstructionEditor({ instruction: initialInstruction }: InstructionEditorProps) {
  const router = useRouter();
  const [instruction, setInstruction] = useState<Instruction>(initialInstruction);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
            <CardContent className="space-y-2">
                {instruction.accessList.map(access => (
                    <div key={access.userId} className="flex items-center justify-between text-sm">
                        <span>User {access.userId}</span>
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground"/>
                            <span>{access.access}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </aside>
    </div>
  );
}
