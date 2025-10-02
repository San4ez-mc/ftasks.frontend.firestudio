'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCompaniesForToken, selectCompany } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';

type Company = {
  id: number;
  name: string;
  role: string;
};

export default function SelectCompanyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tempToken = searchParams.get('token');

    if (!tempToken) {
      setError('Токен автентифікації відсутній. Будь ласка, спробуйте увійти знову.');
      setIsLoading(false);
      return;
    }

    const fetchCompanies = async () => {
      try {
        const userCompanies = await getCompaniesForToken(tempToken);
        setCompanies(userCompanies);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити компанії.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [searchParams]);

  const handleSelectCompany = async (companyId: number) => {
    setIsSubmitting(true);
    setError(null);
    const tempToken = searchParams.get('token');
    if (!tempToken) {
        setError("Сесія застаріла. Будь ласка, увійдіть знову.");
        setIsSubmitting(false);
        return;
    }
    const startPage = searchParams.get('start') || 'tasks';
    const redirectUrl = startPage === 'audit' ? '/audit' : '/';

    try {
        const permanentToken = await selectCompany(tempToken, companyId);
        localStorage.setItem('authToken', permanentToken);
        router.push(redirectUrl);
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Не вдалося обрати компанію.');
        setIsSubmitting(false);
    }
  };
  
  const handleRedirectToCreate = () => {
    const tempToken = searchParams.get('token');
    const startPage = searchParams.get('start') || 'tasks';
    router.push(`/create-company?token=${tempToken}&start=${startPage}`);
  }
  
  if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (error && !isSubmitting) {
      return (
           <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-destructive">Помилка автентифікації</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                         <Button onClick={() => router.push('/login')} className="mt-4">Перейти на сторінку входу</Button>
                    </CardContent>
                </Card>
           </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-headline">Вибір компанії</CardTitle>
          <CardDescription>Оберіть існуючу компанію або створіть нову.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <>
              <div className="space-y-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company.id)}
                    disabled={isSubmitting}
                    className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    {company.name}
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button variant="ghost" onClick={() => router.push('/login')} className="w-full sm:w-auto" disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                </Button>
                <Button variant="outline" onClick={handleRedirectToCreate} className="w-full flex-1" disabled={isSubmitting}>
                    Створити нову компанію
                </Button>
              </div>
            </>
        </CardContent>
      </Card>
    </div>
  );
}
