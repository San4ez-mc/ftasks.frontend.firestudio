
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader2, Trash2, Mic, FileText, ImageIcon, Clock, Users, ShieldCheck, Wand2 } from 'lucide-react';
import type { Audit } from '@/types/audit';
import { getAudits, createAudit, deleteAudit } from './actions';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AuditsListPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
      const fetchedAudits = await getAudits();
      setAudits(fetchedAudits);
    });
  }, []);

  const handleStartNewAudit = () => {
    startTransition(async () => {
      try {
        const newAudit = await createAudit();
        router.push(`/audit/${newAudit.id}`);
      } catch (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося розпочати новий аудит.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteAudit = (auditId: string) => {
    startTransition(async () => {
        try {
            await deleteAudit(auditId);
            setAudits(audits.filter(a => a.id !== auditId));
            toast({ title: "Успіх", description: "Аудит видалено."});
        } catch (error) {
             toast({
                title: "Помилка",
                description: "Не вдалося видалити аудит.",
                variant: "destructive",
            });
        }
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const hasAuditToday = audits.some(audit => audit.createdAt.startsWith(today));

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight font-headline">Аудит Компанії</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div tabIndex={0}> {/* Wrapper div for tooltip on disabled button */}
                <Button onClick={handleStartNewAudit} disabled={isPending || hasAuditToday}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Розпочати новий аудит
                </Button>
              </div>
            </TooltipTrigger>
            {hasAuditToday && (
              <TooltipContent>
                <p>Новий аудит можна розпочинати лише раз на день.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
             <Wand2 className="text-primary"/>
             Вітаємо на сторінці AI-Аудиту!
          </CardTitle>
          <CardDescription>
            Ось що на вас чекає та як отримати максимальну користь від процесу.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
                AI-консультант буде ставити вам деталізовані питання про вашу компанію. Ваша відвертість — ключ до успіху. Не прикрашайте відповіді та не приховуйте проблем, а навпаки, детально про них розповідайте. Це дозволить набагато глибше проаналізувати та виявити слабкі місця.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500"/>Конфіденційність</h4>
                    <p className="text-xs">Ця інформація не буде доступна стороннім особам. Тільки авторизовані керівники зможуть її переглянути.</p>
                </div>
                 <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-blue-500"/>Аудит команди</h4>
                    <p className="text-xs">Будуть питання про ваших працівників та команду. Бот підготує персональні посилання, щоб вони також могли пройти аудит з питаннями, адаптованими до їх ролі.</p>
                </div>
            </div>
             <div>
                <h4 className="font-semibold text-foreground mb-2">Формати відповідей</h4>
                 <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary" className="gap-1"><Mic className="h-3 w-3"/>Аудіо (рекомендовано)</Badge>
                    <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3"/>Текст</Badge>
                    <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3"/>Картинки</Badge>
                 </div>
                 <p className="mt-2">Ми рекомендуємо на більшість питань відповідати саме аудіо, бо так ви зможете дати значно розгорнутіші відповіді та розповісти більше деталей.</p>
            </div>
            <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Clock className="h-4 w-4"/>Тривалість</h4>
                <p>Аудит триватиме близько півтори години на людину. Рекомендуємо виділити цей час, щоб вас ніхто не відволікав. Звичайно, ви можете поставити процес на паузу в будь-який момент, але для кращого результату радимо не перериватися.</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Історія аудитів</CardTitle>
          <CardDescription>Переглядайте попередні аудити, щоб відслідковувати динаміку змін.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && !audits.length ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div> :
          audits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата та час</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{formatDateTime(audit.createdAt)}</TableCell>
                      <TableCell>{audit.isCompleted ? 'Завершено' : 'В процесі'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/audit/${audit.id}`}>
                            {audit.isCompleted ? 'Переглянути' : 'Продовжити'}
                          </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Цю дію неможливо скасувати. Це назавжди видалить аудит від {formatDateTime(audit.createdAt)}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteAudit(audit.id)}>Видалити</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ви ще не проводили жодного аудиту.</p>
              <p>Натисніть "Розпочати новий аудит", щоб почати.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
