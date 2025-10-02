'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCompanyAndLogin } from '@/lib/api';
import { useState, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

function CreateCompanyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const tempToken = searchParams.get('token');
    if (!tempToken) {
      setError("Ваша сесія застаріла. Будь ласка, увійдіть знову.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const companyName = formData.get('companyName') as string;
    const startPage = searchParams.get('start') || 'tasks';
    const redirectUrl = startPage === 'audit' ? '/audit' : '/';

    try {
      const permanentToken = await createCompanyAndLogin(tempToken, companyName);
      localStorage.setItem('authToken', permanentToken);
      router.push(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити компанію.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-headline">Створити компанію</CardTitle>
          <CardDescription>Ласкаво просимо! Створіть свою першу компанію, щоб почати.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Назва компанії</Label>
              <Input id="companyName" name="companyName" placeholder="Acme Inc." required disabled={isSubmitting} />
            </div>
             <div>
              <Label htmlFor="companyDescription">Опис (необов'язково)</Label>
              <Input id="companyDescription" name="companyDescription" placeholder="Чим займається ваша компанія" disabled={isSubmitting} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Створити та увійти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


export default function CreateCompanyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CreateCompanyForm />
        </Suspense>
    )
}