
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';


const initialInstructions = [
  { id: '1', title: 'Як користуватися CRM', department: 'Відділ продажів', summary: 'Загальні правила та процедури роботи з клієнтською базою.' },
  { id: '2', title: 'Процес онбордингу', department: 'HR', summary: 'Кроки для успішної адаптації нового співробітника.' },
  { id: '3', title: 'Політика відпусток', department: 'Загальні', summary: 'Правила подання та затвердження заяв на відпустку.' },
];

type Instruction = typeof initialInstructions[0];

// --- TOUR STEPS ---

const instructionsTourSteps: TourStep[] = [
    {
        elementId: 'create-instruction-button',
        title: 'Створення нової інструкції',
        content: 'Натисніть цю кнопку, щоб створити нову інструкцію або базу знань для вашої команди.',
        placement: 'left'
    },
    {
        elementId: 'instruction-card-1',
        title: 'Картка інструкції',
        content: 'Кожна інструкція відображається у вигляді такої картки. Натисніть на неї, щоб перейти до редактора та наповнити її змістом.',
        placement: 'bottom'
    },
     {
        elementId: 'instruction-actions-menu',
        title: 'Дії з інструкцією',
        content: 'Відкрийте це меню, щоб редагувати назву та опис існуючої інструкції або видалити її.',
        placement: 'left'
    },
];

export default function InstructionsPage() {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);

  const handleCreateInstruction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newInstruction = {
        id: `instr-${Date.now()}`,
        title: formData.get('instrTitle') as string,
        department: formData.get('instrDept') as string,
        summary: formData.get('instrSummary') as string,
    }
    if (newInstruction.title) {
        setInstructions(prev => [newInstruction, ...prev]);
        setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateInstruction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingInstruction) return;

    const formData = new FormData(event.currentTarget);
    const updatedInstruction = {
      ...editingInstruction,
      title: formData.get('instrTitle') as string,
      department: formData.get('instrDept') as string,
      summary: formData.get('instrSummary') as string,
    };

    setInstructions(instructions.map(p => p.id === updatedInstruction.id ? updatedInstruction : p));
    setEditingInstruction(null);
  }

  const handleDeleteInstruction = (instructionId: string) => {
    setInstructions(instructions.filter(p => p.id !== instructionId));
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <InteractiveTour pageKey="instructions" steps={instructionsTourSteps} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight font-headline">Інструкції</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button id="create-instruction-button">
                    <PlusCircle className="mr-2 h-4 w-4" /> Створити інструкцію
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Створити нову інструкцію</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateInstruction}>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="instrTitle">Назва</Label>
                        <Input id="instrTitle" name="instrTitle" />
                        <Label htmlFor="instrDept">Відділ</Label>
                        <Input id="instrDept" name="instrDept" />
                        <Label htmlFor="instrSummary">Короткий опис</Label>
                        <Textarea id="instrSummary" name="instrSummary" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Створити</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

        {instructions.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {instructions.map((instruction, index) => (
                    <Card key={instruction.id} id={`instruction-card-${instruction.id}`} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">
                                        <Link href={`/instructions/${instruction.id}`} className="hover:underline">
                                            {instruction.title}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription>{instruction.summary}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button id={index === 0 ? "instruction-actions-menu" : undefined} variant="ghost" size="icon" className="shrink-0"><MoreVertical className="h-5 w-5" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingInstruction(instruction)}>
                                            <Edit className="mr-2 h-4 w-4"/> Редагувати
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4"/> Видалити
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Цю дію неможливо скасувати. Це назавжди видалить інструкцію.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteInstruction(instruction.id)}>Видалити</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-auto">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/instructions/${instruction.id}`} className="w-full">Переглянути</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="flex items-center justify-center h-64 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">Інструкцій поки що немає.</p>
            </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={!!editingInstruction} onOpenChange={(open) => !open && setEditingInstruction(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Редагувати інструкцію</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateInstruction}>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="instrTitleEdit">Назва</Label>
                        <Input id="instrTitleEdit" name="instrTitle" defaultValue={editingInstruction?.title} />
                        <Label htmlFor="instrDeptEdit">Відділ</Label>
                        <Input id="instrDeptEdit" name="instrDept" defaultValue={editingInstruction?.department} />
                         <Label htmlFor="instrSummaryEdit">Короткий опис</Label>
                        <Textarea id="instrSummaryEdit" name="instrSummary" defaultValue={editingInstruction?.summary} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setEditingInstruction(null)}>Скасувати</Button>
                        <Button type="submit">Зберегти</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
