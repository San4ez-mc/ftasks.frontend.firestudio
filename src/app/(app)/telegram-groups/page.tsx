
'use client';

import { useState, useRef, useEffect, Suspense, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Send, Link as LinkIcon, RefreshCw, UserPlus, PlusCircle, X, ChevronsUpDown, Trash2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import InteractiveTour, { type TourStep } from '@/components/layout/interactive-tour';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getGroups, linkGroup, getLogsForGroup, sendMessageToGroup, getGroupMembers, refreshGroupMembers, linkTelegramMemberToEmployee } from './actions';
import { getEmployees } from '../company/actions';
import type { TelegramGroup, MessageLog } from '@/types/telegram-group';
import type { TelegramMember } from '@/types/telegram-member';
import type { Employee } from '@/types/company';


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
  const searchParams = useSearchParams();
  const { toast } = useToast();

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

  useEffect(() => {
     if (searchParams.get('action') === 'add-group') {
      setIsAddGroupOpen(true);
    }
  }, [searchParams]);

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
                    // Update existing group
                    const newGroups = [...prev];
                    newGroups[existingGroupIndex] = result.data!;
                    return newGroups;
                } else {
                    // Add new group
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
                        <DialogDescription>Введіть код, який бот надіслав у вашу Telegram-групу.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
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


// --- Main Page Component Wrapper for Suspense ---
export default function TelegramGroupsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <TelegramGroupsPageContent />
    </Suspense>
  )
}


// --- Details Panel Component ---

function TelegramGroupDetails({ group, onClose }: { group: TelegramGroup, onClose: () => void }) {
    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                <h2 className="text-lg font-semibold font-headline">{group.title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <GroupStatusCard 
                    group={group} 
                />
                {group?.id ? (
                    <>
                        <MemberManagementCard group={group}/>
                        <MessageLogCard group={group} />
                    </>
                ) : (
                    <Card className="h-full flex items-center justify-center">
                        <CardContent className="text-center text-muted-foreground p-6">
                            <LinkIcon className="mx-auto h-12 w-12 mb-4" />
                            <p>Прив'яжіть групу, щоб побачити список учасників.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}


// --- Sub-components for Details Panel ---

function GroupStatusCard({ group }: { group: TelegramGroup }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Статус підключення</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <Alert variant="default" className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Групу успішно прив'язано</AlertTitle>
                </Alert>
                <div className="space-y-2">
                    <p><strong>Назва:</strong> {group.title}</p>
                    {group.tgUsername && <p><strong>Юзернейм:</strong> @{group.tgUsername}</p>}
                    <p><strong>Group ID:</strong> <code className="bg-muted px-1.5 py-0.5 rounded">{group.tgGroupId}</code></p>
                    {group.linkedAt && <p><strong>Дата прив'язки:</strong> {new Date(group.linkedAt).toLocaleString()}</p>}
                </div>
                 <div className="flex flex-col gap-2">
                    <Button variant="outline">Перевірити підключення</Button>
                    <Button variant="destructive">Відв'язати групу</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function EmployeeCombobox({ selectedEmployeeId, employees, onSelect }: { selectedEmployeeId?: string | null; employees: Employee[], onSelect: (employeeId: string | null) => void; }) {
  const [open, setOpen] = useState(false);
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between h-8 text-xs"
        >
          {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "Прив'язати до..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Пошук співробітника..." />
          <CommandEmpty>Співробітника не знайдено.</CommandEmpty>
          <CommandGroup>
             <CommandItem
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
              >
                 <X className="mr-2 h-4 w-4" />
                 Не прив'язувати
             </CommandItem>
            {employees.map((employee) => (
              <CommandItem
                key={employee.id}
                value={`${employee.firstName} ${employee.lastName}`}
                onSelect={() => {
                  onSelect(employee.id);
                  setOpen(false);
                }}
              >
                <CheckCircle2
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {employee.firstName} {employee.lastName}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


function MemberManagementCard({ group }: { group: TelegramGroup }) {
    const [members, setMembers] = useState<TelegramMember[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchMembers = () => {
        startTransition(async () => {
            try {
                const [fetchedMembers, fetchedEmployees] = await Promise.all([
                    getGroupMembers(group.id),
                    getEmployees()
                ]);
                setMembers(fetchedMembers);
                setEmployees(fetchedEmployees);
            } catch (error) {
                toast({ title: "Помилка", description: "Не вдалося завантажити дані.", variant: "destructive" });
            }
        });
    }

    useEffect(() => {
        fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group.id]);
    
    const handleRefreshMembers = () => {
        startTransition(async () => {
            try {
                const updatedMembers = await refreshGroupMembers(group.id, group.tgGroupId);
                setMembers(updatedMembers);
                toast({ title: "Склад оновлено!", description: "Список адміністраторів синхронізовано." });
            } catch (error) {
                 toast({ title: "Помилка", description: error instanceof Error ? error.message : "Не вдалося оновити склад.", variant: "destructive" });
            }
        });
    }

    const handleLinkMember = (memberId: string, employeeId: string | null) => {
        startTransition(async () => {
            const updatedMember = await linkTelegramMemberToEmployee(memberId, employeeId);
            if (updatedMember) {
                setMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
                toast({ title: "Прив'язку оновлено."});
            } else {
                toast({ title: "Помилка", description: "Не вдалося оновити прив'язку.", variant: "destructive"});
            }
        });
    }

    return (
         <Card id="member-management-card">
            <CardHeader>
                <CardTitle>Склад Telegram-групи</CardTitle>
                <CardDescription>
                    Відображаються адміністратори групи. Щоб бот бачив звичайних учасників, вимкніть для нього режим конфіденційності в BotFather.
                </CardDescription>
                <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={handleRefreshMembers} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Оновити склад
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isPending && !members.length ? <div className="text-center p-4"><Loader2 className="h-4 w-4 animate-spin mx-auto"/></div> : 
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ім'я (TG)</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Працівник в компанії</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="font-medium">{member.tgFirstName} {member.tgLastName}</div>
                                        {member.tgUsername && <div className="text-xs text-muted-foreground">@{member.tgUsername}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.employeeId ? 'secondary' : 'outline'}>
                                            {member.employeeId ? 'Прив\'язано' : 'Не прив\'язано'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <EmployeeCombobox 
                                            employees={employees}
                                            selectedEmployeeId={member.employeeId}
                                            onSelect={(employeeId) => handleLinkMember(member.id, employeeId)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                }
            </CardContent>
        </Card>
    )
}

function MessageLogCard({ group }: { group: TelegramGroup }) {
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchLogs = () => {
        startTransition(async () => {
            const fetchedLogs = await getLogsForGroup(group.id);
            setLogs(fetchedLogs);
        });
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group.id]);

    const handleSendMessage = () => {
        if (!messageText.trim()) return;
        startTransition(async () => {
            const result = await sendMessageToGroup(group.id, messageText);
            if(result){
                setLogs(prev => [result, ...prev]);
            }
            if (result.status === 'OK') {
                setMessageText('');
                toast({ title: "Повідомлення надіслано!" });
            } else {
                toast({ title: "Помилка відправки", description: result.error, variant: 'destructive' });
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Журнал відправок у Telegram</CardTitle>
                <CardDescription>Останні системні повідомлення, надіслані в групу.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="test-message" className="mb-2 block">Надіслати тестове повідомлення</Label>
                    <div className="flex gap-2">
                        <Textarea 
                            id="test-message" 
                            placeholder="Перевірка зв'язку" 
                            className="min-h-[40px]"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            disabled={isPending}
                        />
                        <Button size="icon" className="shrink-0" onClick={handleSendMessage} disabled={isPending}>
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
                <Separator />
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {isPending && logs.length === 0 ? <div className="text-center p-4"><Loader2 className="h-4 w-4 animate-spin mx-auto"/></div> :
                    logs.map(log => (
                        <div key={log.id} className="text-xs">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                                <Badge variant={log.status === 'OK' ? 'secondary' : 'destructive'}>{log.status}</Badge>
                            </div>
                            <p className="p-2 bg-muted rounded-md font-mono text-muted-foreground">'{log.content}'</p>
                            {log.error && <p className="p-2 mt-1 bg-destructive/10 text-destructive rounded-md font-mono">{log.error}</p>}
                        </div>
                    ))}
                     {logs.length === 0 && !isPending && (
                        <p className="text-center text-muted-foreground py-4">Журнал повідомлень порожній.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
