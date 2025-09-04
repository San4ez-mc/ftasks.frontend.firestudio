
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
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

  const handleCreateProcess = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProcess = {
        id: `proc-${Date.now()}`,
        name: formData.get('procName') as string,
        description: formData.get('procDesc') as string,
    }
    if (newProcess.name) {
        setProcesses(prev => [newProcess, ...prev]);
        setIsCreateDialogOpen(false);
    }
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

        {processes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {processes.map(process => (
                    <Link href={`/processes/${process.id}`} key={process.id}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader>
                            <CardTitle>
                                {process.name}
                            </CardTitle>
                            <CardDescription>{process.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild><span className="w-full">Переглянути деталі</span></Button>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="flex items-center justify-center h-64 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">Бізнес-процесів поки нема.</p>
            </div>
        )}
    </div>
  );
}
