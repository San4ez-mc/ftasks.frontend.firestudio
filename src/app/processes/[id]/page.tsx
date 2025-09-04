
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data, replace with API calls
const mockProcess = {
  id: '1',
  name: 'Onboarding нового співробітника',
  description: 'Процес адаптації та навчання нових членів команди.',
  responsible: 'Марія Сидоренко',
  steps: [
    { id: 'step-1', name: 'Підписання документів', description: 'HR відділ готує договір та NDA.', responsible: 'Олена Ковальчук' },
    { id: 'step-2', name: 'Налаштування робочого місця', description: 'IT відділ видає ноутбук та доступи.', responsible: 'Іван Петренко' },
  ],
};

const mockUsers = [
  { id: '1', name: 'Іван Петренко' },
  { id: '2', name: 'Марія Сидоренко' },
  { id: '3', name: 'Олена Ковальчук' },
];

type ProcessStep = {
  id: string;
  name: string;
  description: string;
  responsible: string;
};

export default function EditProcessPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [process, setProcess] = useState(mockProcess); // Fetch process by params.id
  const [steps, setSteps] = useState<ProcessStep[]>(mockProcess.steps);

  const handleAddStep = () => {
    const newStep: ProcessStep = {
      id: `step-${Date.now()}`,
      name: '',
      description: '',
      responsible: '',
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const handleStepChange = (id: string, field: keyof Omit<ProcessStep, 'id'>, value: string) => {
    setSteps(steps.map(step => step.id === id ? { ...step, [field]: value } : step));
  };
  
  const handleSaveChanges = () => {
    // API call to PATCH /business-processes/{id}
    console.log('Saving changes:', process, steps);
    router.push('/processes');
  };


  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
       <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/processes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
            <Input 
                value={process.name}
                onChange={(e) => setProcess({...process, name: e.target.value})}
                className="text-2xl font-bold tracking-tight font-headline border-none shadow-none p-0 h-auto focus-visible:ring-0"
            />
            <Textarea 
                 value={process.description}
                 onChange={(e) => setProcess({...process, description: e.target.value})}
                 placeholder="Короткий опис процесу..."
                 className="border-none shadow-none p-0 mt-1 text-muted-foreground focus-visible:ring-0 resize-none"
            />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
           <Card>
                <CardHeader>
                    <CardTitle>Кроки процесу</CardTitle>
                    <CardDescription>Опишіть послідовність дій для виконання цього бізнес-процесу.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="p-4 border rounded-lg space-y-3 relative">
                           <div className="flex justify-between items-center">
                             <h4 className="font-semibold">Крок {index + 1}</h4>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveStep(step.id)}>
                                <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`step-name-${step.id}`}>Назва кроку</Label>
                                    <Input 
                                      id={`step-name-${step.id}`} 
                                      value={step.name} 
                                      onChange={(e) => handleStepChange(step.id, 'name', e.target.value)}
                                      placeholder="Наприклад, Підписання документів"
                                    />
                                </div>
                                 <div className="space-y-1.5">
                                    <Label htmlFor={`step-resp-${step.id}`}>Відповідальний за крок</Label>
                                     <Select value={step.responsible} onValueChange={(value) => handleStepChange(step.id, 'responsible', value)}>
                                        <SelectTrigger id={`step-resp-${step.id}`}>
                                            <SelectValue placeholder="Обрати..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockUsers.map(user => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`step-desc-${step.id}`}>Опис кроку</Label>
                                <Textarea 
                                  id={`step-desc-${step.id}`} 
                                  value={step.description}
                                  onChange={(e) => handleStepChange(step.id, 'description', e.target.value)}
                                  placeholder="Детальний опис того, що потрібно зробити на цьому етапі."
                                />
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" onClick={handleAddStep} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Додати крок
                    </Button>
                </CardContent>
           </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Деталі</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="process-responsible">Відповідальний за процес</Label>
                         <Select value={process.responsible} onValueChange={(value) => setProcess({...process, responsible: value})}>
                            <SelectTrigger id="process-responsible">
                                <SelectValue placeholder="Обрати..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mockUsers.map(user => <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-1.5">
                        <Label>Прив'язка до результату</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Не прив'язано" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Mock results */}
                                <SelectItem value="res-1">Запустити рекламну кампанію</SelectItem>
                                <SelectItem value="res-2">Розробити модуль аналітики</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                 <Button onClick={handleSaveChanges} className="flex-1">Зберегти зміни</Button>
                 <Button variant="destructive" className="flex-1">Видалити процес</Button>
            </div>
        </div>
      </div>
    </div>
  );
}
