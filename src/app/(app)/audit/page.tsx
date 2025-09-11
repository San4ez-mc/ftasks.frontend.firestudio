
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader2 } from 'lucide-react';
import type { Audit } from '@/types/audit';
import { getAudits, createAudit } from './actions';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight font-headline">Аудити компанії</h1>
        <Button onClick={handleStartNewAudit} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Розпочати новий аудит
        </Button>
      </div>

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
                    <TableHead>Дата проведення</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{formatDate(audit.createdAt)}</TableCell>
                      <TableCell>{audit.isCompleted ? 'Завершено' : 'В процесі'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/audit/${audit.id}`}>
                            {audit.isCompleted ? 'Переглянути' : 'Продовжити'}
                          </Link>
                        </Button>
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
