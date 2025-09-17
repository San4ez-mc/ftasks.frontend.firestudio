
'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import InteractiveTour, { type TourStep } from '@/components/layout/interactive-tour';
import { useToast } from '@/hooks/use-toast';
import { getGroups, linkGroup } from './actions';
import type { TelegramGroup } from '@/types/telegram-group';
import { cn } from '@/lib/utils';
import TelegramGroupDetails from './_components/TelegramGroupDetails';


// --- TOUR STEPS ---
const telegramTourSteps: TourStep[] = [
    {
        elementId: 'group-list',
        title: 'Список груп',
        content: 'Тут відображаються всі ваші Telegram-групи. Натисніть на будь-яку, щоб переглянути деталі та керувати нею.',
    },
    {
        elementId: 'add-group-button',
        title: 'Додавання нової групи',
        content: 'Натисніть тут, щоб прив\'язати нову Telegram-групу. Вам знадобиться код, який бот надішле у вашу групу.',
    },
    {
        elementId: 'group-details-panel',
        title: 'Панель деталей групи',
        content: 'Після вибору групи тут з\'явиться детальна інформація: статус підключення, список учасників та журнал повідомлень.',
    },
    {
        elementId: 'member-management-card',
        title: 'Керування учасниками',
        content: 'У цьому блоці ви можете бачити учасників Telegram-групи та прив\'язувати їх до профілів співробітників у системі.',
    },
];

function TelegramGroupsPageContent() {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // This effect runs once on component mount to check for the URL action.
  // It avoids using useSearchParams, which was causing rendering issues.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add-group') {
      setIsAddGroupOpen(true);
    }
  }, []);


  const fetchGroups = () => {
    startTransition(async () => {
        const fetchedGroups = await getGroups();
        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0 && !selectedGroup) {
            setSelectedGroup(fetchedGroups[0]);
        }
    });
  }

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLinkGroup = () => {
    if (!linkCode) return;
    startTransition(async () => {
        const result = await linkGroup(linkCode);
        if (result.success && result.data) {
            toast({ title: "Успіх!", description: result.message });
            setLinkCode('');
            setIsAddGroupOpen(false);
            setGroups(prev => {
                const existingGroupIndex = prev.findIndex(g => g.id === result.data!.id);
                if (existingGroupIndex !== -1) {
                    const newGroups = [...prev];
                    newGroups[existingGroupIndex] = result.data!;
                    return newGroups;
                } else {
                    return [result.data!, ...prev];
                }
            });
            setSelectedGroup(result.data);
        } else {
            toast({ title: "Помилка", description: result.message, variant: "destructive" });
        }
    });
  }

  const handleClosePanel = () => {
    setSelectedGroup(null);
  }

  const handleDeleteGroup = (groupId: string) => {
    // TODO: Implement delete action
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
        <InteractiveTour pageKey="telegram-groups" steps={telegramTourSteps} />
      <div className={cn(
        "flex flex-col transition-all duration-300 w-full",
        selectedGroup ? "md:w-1/2 lg:w-2/5" : "w-full"
      )}>
        <header className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight font-headline">Телеграм групи</h1>
            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
                <DialogTrigger asChild>
                    <Button id="add-group-button"><PlusCircle className="mr-2 h-4 w-4"/>Додати групу</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Прив'язка нової групи</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-3 text-sm">
                               <p>Щоб отримати код, виконайте наступні кроки:</p>
                               <ol className="list-decimal list-inside space-y-2 bg-muted p-3 rounded-md">
                                    <li>Додайте бота <code className="font-mono bg-background px-1 py-0.5 rounded">@FinekoTasks_Bot</code> у вашу Telegram-групу.</li>
                                    <li>Призначте бота адміністратором групи.</li>
                                    <li>Напишіть у чат групи команду <code className="font-mono bg-background px-1 py-0.5 rounded">/start</code>.</li>
                                    <li>Бот надішле у відповідь 6-значний код.</li>
                               </ol>
                               <p>Введіть отриманий код нижче.</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="pt-4 space-y-2">
                        <Label htmlFor="link-code">Код прив'язки групи</Label>
                        <Input id="link-code" placeholder="Введіть 6-значний код..." value={linkCode} onChange={(e) => setLinkCode(e.target.value)} disabled={isPending} />
                    </div>
                    <DialogFooter>
                        <Button className="w-full" onClick={handleLinkGroup} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LinkIcon className="mr-2 h-4 w-4" />}
                            Прив'язати
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </header>
        <main id="group-list" className="flex-1 overflow-y-auto px-4 md:px-6 space-y-4">
           {isPending && !groups.length ? <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div> :
           groups.map(group => (
             <Card 
                key={group.id} 
                className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow group/item",
                    selectedGroup?.id === group.id && "ring-2 ring-primary"
                )}
             >
                <CardContent className="p-4 flex items-center justify-between" onClick={() => setSelectedGroup(group)}>
                    <p className="font-semibold">{group.title}</p>
                    <div className="flex items-center gap-2">
                        <Badge variant={group.id ? "secondary" : "outline"}>
                            {group.id ? "Прив'язано" : "Не прив'язано"}
                        </Badge>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 opacity-0 group-hover/item:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Це назавжди видалить групу "{group.title}" та її налаштування.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={e => e.stopPropagation()}>Скасувати</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>Видалити</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
             </Card>
           ))}
        </main>
      </div>
      
      <div id="group-details-panel" className={cn(
        "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden",
        selectedGroup ? "w-full md:w-1/2 lg:w-3/5" : "w-0"
      )}>
        {selectedGroup && <TelegramGroupDetails key={selectedGroup.id} group={selectedGroup} onClose={handleClosePanel} />}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
     <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
     </div>
  )
}

// This is the main export. It wraps the client component in Suspense
// for cases where it might be needed, even though we removed the direct hook dependency.
export default function TelegramGroupsPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <TelegramGroupsPageContent />
        </Suspense>
    )
}

    