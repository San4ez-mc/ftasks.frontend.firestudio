
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2, Loader2, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';
import type { Instruction } from '@/types/instruction';
import { getInstructions, createInstruction, updateInstruction, deleteInstruction } from './actions';
import { useToast } from '@/hooks/use-toast';

export const manualInstruction: Instruction = {
    id: 'instr-manual-system',
    companyId: 'system',
    title: 'Як користуватися FINEKO',
    department: 'Довідка',
    summary: 'Основний посібник користувача з оглядом всього функціоналу системи.',
    content: `
# Ласкаво просимо до FINEKO!

Це ваш головний посібник для роботи з системою.

## 1. Результати (/results)
Це модуль для постановки та відстеження довгострокових, стратегічних цілей (аналог OKR).
- **Створюйте цілі:** Кожен результат - це велика мета з чітким дедлайном.
- **Декомпозиція:** Розбивайте великі результати на менші, конкретні підрезультати (чек-листи).
- **Призначайте відповідальних:** Кожен результат має одного відповідального.

## 2. Задачі щоденні (/)
Ваш щоденний таск-менеджер.
- **Плануйте день:** Створюйте задачі на конкретний день.
- **Прив'язка до результатів:** Створюйте задачі безпосередньо з результатів, щоб бачити, як щоденна робота наближає вас до глобальних цілей.
- **Пріоритезація:** Використовуйте матрицю Ейзенхауера для класифікації задач.
- **Облік часу:** Вказуйте очікуваний та фактичний час для аналізу ефективності.

## 3. Шаблони (/templates)
Автоматизуйте рутинні задачі.
- **Створюйте шаблони:** Налаштуйте шаблон для задачі, яка повторюється (напр., "Щотижневий звіт").
- **Налаштуйте періодичність:** Вкажіть, як часто має створюватися задача (щодня, щотижня і т.д.).
- **Система сама створить задачу** у потрібний день.

## 4. Орг. структура (/org-structure)
Візуалізуйте структуру вашої компанії.
- **Відділення та відділи:** Побудуйте ієрархію вашої компанії.
- **ЦКП (Цінний Кінцевий Продукт):** Для кожного відділу визначте його головний результат роботи.
- **Призначення співробітників:** Розподіліть співробітників по відділах та секціях, призначте керівників.

## 5. Бізнес-процеси (/processes)
Картографуйте та стандартизуйте ваші робочі процеси.
- **Візуальний редактор:** Створюйте схеми процесів, схожі на BPMN.
- **Доріжки (Lanes):** Прив'язуйте етапи процесу до конкретних посад або відділів з орг.структури.
- **Кроки (Steps):** Описуйте кожен крок, призначайте відповідального та вказуйте, де зберігаються дані.

## 6. Інструкції (/instructions)
Ваша корпоративна база знань.
- **Створюйте статті:** Пишіть інструкції, регламенти, правила.
- **Rich-Text Редактор:** Форматуйте текст, додавайте списки, заголовки.
- **Керування доступами:** Вказуйте, хто зі співробітників може читати чи редагувати кожну окрему інструкцію.

## 7. Компанія (/company)
Керування профілем компанії та співробітниками.
- **Список співробітників:** Переглядайте та редагуйте профілі всіх членів команди.
- **Дозволи для Telegram-бота:** Налаштовуйте, які команди може виконувати кожен співробітник через Telegram.

## 8. Телеграм групи (/telegram-groups)
Інтеграція робочого простору з Telegram.
- **Прив'язуйте групи:** Підключіть робочі чати до FINEKO.
- **Керування ботом:** Використовуйте команди природною мовою (текстом або голосом) для створення задач, результатів та отримання інформації прямо в Telegram.

## 9. Аудит (/audit)
Інструмент для стратегічного аналізу вашого бізнесу за допомогою AI.
- **Інтерактивне інтерв'ю:** AI-консультант поставить вам низку питань про ключові аспекти вашого бізнесу.
- **Автоматичне резюме:** Система в реальному часі формує звіт про поточний стан справ.
- **План робіт:** За результатами аудиту AI генерує конкретний план дій для усунення слабких місць та систематизації бізнесу.
`,
    accessList: [],
};


// --- TOUR STEPS ---

const instructionsTourSteps: TourStep[] = [
    {
        elementId: 'create-instruction-button',
        title: 'Створення нової інструкції',
        content: 'Натисніть цю кнопку, щоб створити нову інструкцію або базу знань для вашої команди.',
        placement: 'left'
    },
    {
        elementId: `instruction-card-${manualInstruction.id}`,
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
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    startTransition(async () => {
        const fetched = await getInstructions();
        setInstructions(fetched);
    });
  }, []);

  const allInstructions = [manualInstruction, ...instructions];

  const handleCreateInstruction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('instrTitle') as string;
    
    if (title) {
        const newInstructionData: Omit<Instruction, 'id' | 'companyId'> = {
            title,
            department: formData.get('instrDept') as string,
            summary: formData.get('instrSummary') as string,
            content: '', // Start with empty content
            accessList: [], // Start with empty access list
        };
        
        startTransition(async () => {
            try {
                const created = await createInstruction(newInstructionData);
                setInstructions(prev => [created, ...prev]);
                setIsCreateDialogOpen(false);
                router.push(`/instructions/${created.id}`); // Redirect to edit page
            } catch (error) {
                toast({ title: "Помилка", description: "Не вдалося створити інструкцію.", variant: "destructive" });
            }
        });
    }
  };

  const handleUpdateInstruction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingInstruction) return;

    const formData = new FormData(event.currentTarget);
    const updatedInstructionData: Partial<Instruction> = {
      title: formData.get('instrTitle') as string,
      department: formData.get('instrDept') as string,
      summary: formData.get('instrSummary') as string,
    };

    startTransition(async () => {
        try {
            const updated = await updateInstruction(editingInstruction.id, updatedInstructionData);
            if(updated) {
                setInstructions(instructions.map(p => p.id === updated.id ? updated : p));
            }
            setEditingInstruction(null);
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося оновити інструкцію.", variant: "destructive" });
        }
    });
  }

  const handleDeleteInstruction = (instructionId: string) => {
    startTransition(async () => {
        try {
            await deleteInstruction(instructionId);
            setInstructions(instructions.filter(p => p.id !== instructionId));
        } catch (error) {
             toast({ title: "Помилка", description: "Не вдалося видалити інструкцію.", variant: "destructive" });
        }
    });
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
                    <DialogDescription>Після створення ви перейдете на сторінку редагування.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateInstruction}>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="instrTitle">Назва</Label>
                        <Input id="instrTitle" name="instrTitle" required/>
                        <Label htmlFor="instrDept">Відділ</Label>
                        <Input id="instrDept" name="instrDept" />
                        <Label htmlFor="instrSummary">Короткий опис</Label>
                        <Textarea id="instrSummary" name="instrSummary" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Створити
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

        {isPending && allInstructions.length <= 1 ? (<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>) :
        allInstructions.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {allInstructions.map((instruction, index) => {
                    const isSystemManual = instruction.id === 'instr-manual-system';
                    return (
                        <Card key={instruction.id} id={`instruction-card-${instruction.id}`} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {isSystemManual && <BookOpen className="h-5 w-5 text-primary" />}
                                            <Link href={`/instructions/${instruction.id}`} className="hover:underline">
                                                {instruction.title}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription>{instruction.summary}</CardDescription>
                                    </div>
                                    {!isSystemManual && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button id={index === 1 ? "instruction-actions-menu" : undefined} variant="ghost" size="icon" className="shrink-0"><MoreVertical className="h-5 w-5" /></Button>
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
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/instructions/${instruction.id}`} className="w-full">Переглянути</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
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
                        <Input id="instrTitleEdit" name="instrTitle" defaultValue={editingInstruction?.title} required />
                        <Label htmlFor="instrDeptEdit">Відділ</Label>
                        <Input id="instrDeptEdit" name="instrDept" defaultValue={editingInstruction?.department} />
                         <Label htmlFor="instrSummaryEdit">Короткий опис</Label>
                        <Textarea id="instrSummaryEdit" name="instrSummary" defaultValue={editingInstruction?.summary} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setEditingInstruction(null)}>Скасувати</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Зберегти
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
