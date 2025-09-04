
'use client';

import { useState } from 'react';
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
import { CheckCircle2, AlertCircle, Send, Link as LinkIcon, RefreshCw, UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


// --- Mock Data ---

const mockGroupStatus = {
  linked: true,
  group_id: '-1001234567890',
  title: 'Fineko Development Team',
  username: 'fineko_dev_chat',
  linked_at: '2024-08-01T10:00:00Z',
};

const mockTelegramMembers = [
  { tg_user_id: '12345', name: 'Іван Петренко', username: 'ivan_p', status: 'linked', employee_id: 'emp-1' },
  { tg_user_id: '67890', name: 'Марія Сидоренко', username: 'maria_s', status: 'created', employee_id: 'emp-2' },
  { tg_user_id: '54321', name: 'Олена Ковальчук', username: 'olena_k', status: 'not_linked', employee_id: null },
];

const mockCompanyEmployees = [
    { id: 'emp-1', name: 'Іван Петренко' },
    { id: 'emp-2', name: 'Марія Сидоренко' },
    { id: 'emp-3', name: 'Олена Ковальчук' },
];

const mockMessageLogs = [
  { id: 'log-1', timestamp: new Date(), content: 'Weekly report has been generated.', status: 'OK', error: null },
  { id: 'log-2', timestamp: new Date(Date.now() - 3600000), content: 'New task assigned: "Fix login bug"', status: 'OK', error: null },
  { id: 'log-3', timestamp: new Date(Date.now() - 7200000), content: 'Test message from admin panel.', status: 'Error', error: '403: Forbidden: bot was kicked from the group' },
];

// --- Components ---

function GroupStatusCard({ status }: { status: typeof mockGroupStatus | null }) {
    if (!status?.linked) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Прив'язка групи</CardTitle>
                    <CardDescription>Введіть код, який бот надіслав у вашу Telegram-групу.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="link-code">Код прив'язки групи</Label>
                        <Input id="link-code" placeholder="Введіть код..." />
                    </div>
                    <Button className="w-full">
                        <LinkIcon className="mr-2" /> Прив'язати
                    </Button>
                </CardContent>
            </Card>
        )
    }

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
                    <p><strong>Назва:</strong> {status.title}</p>
                    {status.username && <p><strong>Юзернейм:</strong> @{status.username}</p>}
                    <p><strong>Group ID:</strong> <code className="bg-muted px-1.5 py-0.5 rounded">{status.group_id}</code></p>
                    <p><strong>Дата прив'язки:</strong> {new Date(status.linked_at).toLocaleString()}</p>
                </div>
                 <div className="flex flex-col gap-2">
                    <Button variant="outline">Перевірити підключення</Button>
                    <Button variant="destructive">Відв'язати групу</Button>
                </div>
            </CardContent>
        </Card>
    );
}


function MemberManagementCard({ members }: { members: typeof mockTelegramMembers }) {
    return (
         <Card>
            <CardHeader>
                <CardTitle>Склад Telegram-групи</CardTitle>
                <CardDescription>Учасники групи та їх статус у компанії.</CardDescription>
                <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Оновити склад</Button>
                    <Button size="sm"><UserPlus className="mr-2 h-4 w-4" /> Імпортувати всіх</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ім'я (TG)</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Дія</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map(member => (
                                <TableRow key={member.tg_user_id}>
                                    <TableCell>
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-xs text-muted-foreground">@{member.username}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.status === 'not_linked' ? 'destructive' : 'secondary'}>
                                            {member.status === 'linked' && 'Прив\'язано'}
                                            {member.status === 'created' && 'Створено'}
                                            {member.status === 'not_linked' && 'Немає'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {member.status === 'not_linked' && (
                                            <Select>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Прив'язати до..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {mockCompanyEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )}
                                         {member.status !== 'not_linked' && (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

function MessageLogCard({ logs }: { logs: typeof mockMessageLogs }) {
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
                        <Textarea id="test-message" placeholder="Перевірка зв'язку" className="min-h-[40px]"/>
                        <Button size="icon" className="shrink-0"><Send className="h-4 w-4"/></Button>
                    </div>
                </div>
                <Separator />
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {logs.map(log => (
                        <div key={log.id} className="text-xs">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">{log.timestamp.toLocaleString()}</span>
                                <Badge variant={log.status === 'OK' ? 'secondary' : 'destructive'}>{log.status}</Badge>
                            </div>
                            <p className="p-2 bg-muted rounded-md font-mono text-muted-foreground">'{log.content}'</p>
                            {log.error && <p className="p-2 mt-1 bg-destructive/10 text-destructive rounded-md font-mono">{log.error}</p>}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}


export default function TelegramGroupsPage() {
  const [groupStatus, setGroupStatus] = useState<typeof mockGroupStatus | null>(mockGroupStatus);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Телеграм групи</h1>
      </div>
      
       <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
                <GroupStatusCard status={groupStatus} />
                {groupStatus?.linked && <MessageLogCard logs={mockMessageLogs} />}
            </div>
            <div className="lg:col-span-3">
                 {groupStatus?.linked ? (
                    <MemberManagementCard members={mockTelegramMembers}/>
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

    </div>
  );
}
