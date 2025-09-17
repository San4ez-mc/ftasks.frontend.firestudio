
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, PlusCircle, Loader2, Trash2, Send, RefreshCw, X } from 'lucide-react';
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
import { getGroups, linkGroup, getGroupMembers, refreshGroupMembers, sendMessageToGroup, getLogsForGroup, linkTelegramMemberToEmployee } from './actions';
import { getEmployees } from '../company/actions';
import type { TelegramGroup, MessageLog } from '@/types/telegram-group';
import type { TelegramMember } from '@/types/telegram-member';
import type { Employee } from '@/types/company';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils';


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

export default function TelegramGroupsPage() {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  useEffect(() => {
    // This effect runs only once on the client after mounting.
    // It safely reads the URL without causing server/client mismatches.
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add-group') {
        setIsAddGroupOpen(true);
    }
    
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

// --- Details Panel ---

function TelegramGroupDetails({ group, onClose }: { group: TelegramGroup, onClose: () => void }) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [isPending, startTransition] = useTransition();
    const [members, setMembers] = useState<TelegramMember[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        startTransition(async () => {
            const [fetchedLogs, fetchedMembers, fetchedEmployees] = await Promise.all([
                getLogsForGroup(group.id),
                getGroupMembers(group.id),
                getEmployees()
            ]);
            setLogs(fetchedLogs);
            setMembers(fetchedMembers);
            setEmployees(fetchedEmployees);
        });
    }, [group.id]);

    const handleSendMessage = async () => {
        if (!message) return;
        setIsSending(true);
        try {
            const newLog = await sendMessageToGroup(group.id, message);
            setLogs(prev => [newLog, ...prev]);
            setMessage('');
        } catch (error) {
            toast({ title: "Помилка відправки", description: error instanceof Error ? error.message : "Невідома помилка.", variant: "destructive"});
        } finally {
            setIsSending(false);
        }
    };
    
    const handleRefreshMembers = () => {
        startTransition(async () => {
            try {
                const refreshedMembers = await refreshGroupMembers(group.id, group.tgGroupId);
                setMembers(refreshedMembers);
                toast({ title: "Успіх", description: "Склад групи оновлено." });
            } catch (error) {
                toast({ title: "Помилка", description: error instanceof Error ? error.message : "Не вдалося оновити склад.", variant: "destructive" });
            }
        });
    }
    
    const handleLinkMember = (memberId: string, employeeId: string | null) => {
        startTransition(async () => {
            try {
                const updatedMember = await linkTelegramMemberToEmployee(memberId, employeeId);
                if(updatedMember) {
                    setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
                }
            } catch (error) {
                toast({ title: "Помилка", description: "Не вдалося прив'язати співробітника.", variant: "destructive" });
            }
        });
    }

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold font-headline">{group.title}</h2>
                    <p className="text-xs text-muted-foreground">ID групи: {group.tgGroupId}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </header>
            <main className="flex-1 p-4 space-y-4 overflow-y-auto">
                <Card id="member-management-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Керування учасниками</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground p-0 pt-1">Прив'яжіть Telegram-акаунти до профілів співробітників.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleRefreshMembers} disabled={isPending}>
                                <RefreshCw className={cn("mr-2 h-4 w-4", isPending && "animate-spin")} />
                                Оновити склад
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isPending && !members.length ? <p className="text-xs text-muted-foreground">Завантаження...</p> :
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Telegram-акаунт</TableHead>
                                    <TableHead>Співробітник в системі</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map(member => {
                                    const linkedEmployee = employees.find(e => e.id === member.employeeId);
                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://i.pravatar.cc/40?u=${member.tgUserId}`} />
                                                        <AvatarFallback>{member.tgFirstName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-xs font-medium">{member.tgFirstName} {member.tgLastName}</p>
                                                        <p className="text-xs text-muted-foreground">@{member.tgUsername}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={member.employeeId || 'none'}
                                                    onValueChange={(value) => handleLinkMember(member.id, value === 'none' ? null : value)}
                                                >
                                                    <SelectTrigger className="text-xs">
                                                        <SelectValue placeholder="Не прив'язано" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Не прив'язано</SelectItem>
                                                        {employees.map(emp => (
                                                            <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                        }
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                         <CardTitle className="text-base">Відправити повідомлення</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="relative">
                            <Textarea placeholder="Введіть ваше повідомлення..." value={message} onChange={e => setMessage(e.target.value)} disabled={isSending}/>
                            <Button size="icon" className="absolute right-2 bottom-2 h-8 w-8" onClick={handleSendMessage} disabled={isSending}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                         <CardTitle className="text-base">Журнал повідомлень</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isPending && !logs.length ? <p className="text-xs text-muted-foreground">Завантаження...</p> :
                         logs.map(log => (
                            <div key={log.id} className="text-xs p-2 border rounded-md">
                                <div className="flex justify-between items-center">
                                    <Badge variant={log.status === 'OK' ? 'secondary' : 'destructive'}>{log.status}</Badge>
                                    <span className="text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap">{log.content}</p>
                                {log.error && <p className="mt-1 text-destructive">{log.error}</p>}
                            </div>
                         ))}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
