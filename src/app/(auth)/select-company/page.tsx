'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { getCompaniesForToken, selectCompany, createCompanyAndLogin } from '@/lib/api';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

type Company = {
  id: number;
  name: string;
  role: string;
};

function SelectCompanyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
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
    const startPage = searchParams.get('start') || '';
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
  
  const handleCreateCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const tempToken = searchParams.get('token');
    if (!tempToken) {
      setError("Ваша сесія застаріла. Будь ласка, увійдіть знову.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const companyName = formData.get('companyName') as string;
    const startPage = searchParams.get('start') || '';
    const redirectUrl = startPage === 'audit' ? '/audit' : '/';

    try {
      const permanentToken = await createCompanyAndLogin(tempToken, companyName);
      localStorage.setItem('authToken', permanentToken);
      router.push(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити компанію.');
      setIsSubmitting(false);
    }
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
          {!showCreate ? (
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
                <Button variant="outline" onClick={() => setShowCreate(true)} className="w-full flex-1" disabled={isSubmitting}>
                    Створити нову компанію
                </Button>
              </div>
            </>
          ) : (
             <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                    <Label htmlFor="companyName">Назва компанії</Label>
                    <Input id="companyName" name="companyName" placeholder="Ваша компанія" required disabled={isSubmitting} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} disabled={isSubmitting}>Назад</Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Створити та увійти
                    </Button>
                </div>
             </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function SelectCompanyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SelectCompanyForm />
        </Suspense>
    )
}