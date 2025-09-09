
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialInstructions = [
  { id: '1', title: 'Як користуватися CRM', department: 'Відділ продажів' },
  { id: '2', title: 'Правила оформлення відпустки', department: 'HR' },
  { id: '3', title: 'Гайд по роботі з Figma', department: 'Дизайн' },
];

type Instruction = typeof initialInstructions[0];

export default function InstructionsPage() {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);

  const handleCreateInstruction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newInstruction = {
      id: `instr-${Date.now()}`,
      title: formData.get('instrTitle') as string,
      department: formData.get('instrDept') as string,
    };
    if (newInstruction.title) {
      setInstructions(prev => [newInstruction, ...prev]);
      setIsDialogOpen(false);
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
    };

    setInstructions(instructions.map(i => i.id === updatedInstruction.id ? updatedInstruction : i));
    setEditingInstruction(null);
  };

  const handleDeleteInstruction = (instructionId: string) => {
    setInstructions(instructions.filter(i => i.id !== instructionId));
  };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight font-headline">Інструкції</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Створити інструкцію
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити нову інструкцію</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInstruction} className="space-y-4">
                <div>
                    <Label htmlFor="instrTitle">Назва</Label>
                    <Input id="instrTitle" name="instrTitle" placeholder="Назва інструкції" />
                </div>
                 <div>
                    <Label htmlFor="instrDept">Відділ</Label>
                    <Input id="instrDept" name="instrDept" placeholder="Наприклад, HR" />
                </div>
              <DialogFooter>
                <Button type="submit">Створити</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Пошук інструкцій..." className="pl-10" />
      </div>

       <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {instructions.map((instruction) => (
          <Card key={instruction.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
             <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-lg">
                           <Link href={`/instructions/${instruction.id}`} className="hover:underline">
                             {instruction.title}
                           </Link>
                        </CardTitle>
                        <CardDescription>{instruction.department}</CardDescription>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0"><MoreVertical className="h-5 w-5" /></Button>
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
                    <Link href={`/instructions/${instruction.id}`}>Переглянути</Link>
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>

       {/* Edit Dialog */}
        <Dialog open={!!editingInstruction} onOpenChange={(open) => !open && setEditingInstruction(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Редагувати інструкцію</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateInstruction} className="space-y-4">
                    <div>
                        <Label htmlFor="instrTitleEdit">Назва</Label>
                        <Input id="instrTitleEdit" name="instrTitle" defaultValue={editingInstruction?.title} />
                    </div>
                    <div>
                        <Label htmlFor="instrDeptEdit">Відділ</Label>
                        <Input id="instrDeptEdit" name="instrDept" defaultValue={editingInstruction?.department} />
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
