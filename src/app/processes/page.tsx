'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit } from 'lucide-react';
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

const initialProcesses = [
  { id: '1', name: 'Onboarding нового співробітника', description: 'Процес адаптації та навчання нових членів команди.' },
  { id: '2', name: 'Запуск маркетингової кампанії', description: 'Від ідеї до аналізу результатів.' },
  { id: '3', name: 'Обробка запиту від клієнта', description: 'Стандартизований процес комунікації з клієнтами.' },
];

type Process = typeof initialProcesses[0];

export default function ProcessesPage() {
  const [processes, setProcesses] = useState(initialProcesses);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);

  const handleCreateProcess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreateDialogOpen(false);
  };
  
  const handleUpdateProcess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditingProcess(null);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Бізнес-процеси</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Створити бізнес-процес
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Створити новий бізнес-процес</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateProcess}>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="procName">Назва процесу</Label>
                        <Input id="procName" name="procName" />
                        <Label htmlFor="procDesc">Опис</Label>
                        <Textarea id="procDesc" name="procDesc" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Створити</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {processes.map(process => (
          <Card key={process.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="flex-1">{process.name}</span>
                <Button variant="ghost" size="icon" onClick={() => setEditingProcess(process)} className="shrink-0 ml-2">
                    <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>{process.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Переглянути деталі</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingProcess} onOpenChange={() => setEditingProcess(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати бізнес-процес</DialogTitle>
            <DialogDescription>{editingProcess?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProcess}>
            <div className="grid gap-4 py-4">
              <Label htmlFor="editProcName">Назва процесу</Label>
              <Input id="editProcName" name="editProcName" defaultValue={editingProcess?.name} />
              <Label htmlFor="editProcDesc">Опис</Label>
              <Textarea id="editProcDesc" name="editProcDesc" defaultValue={editingProcess?.description} />
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setEditingProcess(null)}>Скасувати</Button>
              <Button type="submit">Зберегти зміни</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
