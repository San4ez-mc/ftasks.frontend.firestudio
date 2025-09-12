
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getJoinedCompanies, leaveCompany } from './actions';

type Company = {
  id: string;
  name: string;
};

export default function CompaniesSettingsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchCompanies = () => {
    startTransition(async () => {
      try {
        const fetchedCompanies = await getJoinedCompanies();
        setCompanies(fetchedCompanies);
      } catch (error) {
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити список компаній.",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    fetchCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeaveCompany = (companyId: string, companyName: string) => {
    startTransition(async () => {
      const result = await leaveCompany(companyId);
      if (result.success) {
        toast({
          title: "Успіх!",
          description: result.message,
        });
        fetchCompanies(); // Refresh the list
      } else {
        toast({
          title: "Помилка",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h1 className="text-xl font-bold tracking-tight font-headline">Налаштування компаній</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Мої компанії</CardTitle>
          <CardDescription>Список компаній, до яких ви належите. Ви не можете покинути компанію, якщо є її власником.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && !companies.length ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
          ) : companies.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва компанії</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isPending}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Покинути
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ви дійсно хочете покинути компанію "{company.name}"? Цю дію неможливо буде скасувати.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Скасувати</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleLeaveCompany(company.id, company.name)}>
                                Так, покинути
                              </AlertDialogAction>
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
              <p>Ви не є учасником жодної компанії.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
