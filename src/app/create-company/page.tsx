
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCompanyAndLogin } from '@/lib/api';
import { useState } from 'react';

export default function CreateCompanyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const handleCreateCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const tempToken = searchParams.get('token');
    if (!tempToken) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const companyName = formData.get('companyName') as string;

    try {
      // This function should create the company and log the user in
      await createCompanyAndLogin(tempToken, companyName);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company.');
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
              <Input id="companyName" name="companyName" placeholder="Acme Inc." required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Створити та увійти</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
