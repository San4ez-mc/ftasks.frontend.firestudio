
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { getAllCompanies } from './actions';
import type { CompanyProfile } from '@/types/company-profile';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type CompanyWithCount = CompanyProfile & { userCount: number };

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getAllCompanies();
      setCompanies(data);
    });
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Компанії</CardTitle>
          <CardDescription>Список всіх компаній, зареєстрованих в системі.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва компанії</TableHead>
                    <TableHead>Тариф</TableHead>
                    <TableHead>Користувачів</TableHead>
                    <TableHead>Тріал до</TableHead>
                    <TableHead>Оплачено до</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <Badge variant={company.subscriptionTier === 'paid' ? 'default' : 'secondary'}>
                          {company.subscriptionTier || 'free'}
                        </Badge>
                      </TableCell>
                      <TableCell>{company.userCount}</TableCell>
                      <TableCell>{company.trialEnds ? formatDate(company.trialEnds) : '-'}</TableCell>
                      <TableCell>{company.subscriptionExpires ? formatDate(company.subscriptionExpires) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
