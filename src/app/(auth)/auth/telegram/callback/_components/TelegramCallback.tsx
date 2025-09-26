
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCompaniesForToken, selectCompany } from '@/lib/api';
import { Loader2 } from 'lucide-react';

type Company = {
  id: string;
  name: string;
};

// This component contains the original logic and uses the useSearchParams hook.
export default function TelegramCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Автентифікація...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tempToken = searchParams.get('token');
    const startPage = searchParams.get('start') || 'tasks'; // Default to tasks

    if (!tempToken) {
      setError('Токен автентифікації відсутній. Будь ласка, спробуйте увійти знову.');
      return;
    }

    const handleAuthentication = async () => {
      try {
        setStatus('Отримуємо ваші компанії...');
        const companies = await getCompaniesForToken(tempToken);
        
        const redirectUrl = startPage === 'audit' ? '/audit' : '/';

        if (companies.length === 1) {
          // If user has exactly one company, log them in automatically.
          setStatus('Виконуємо вхід...');
          await selectCompany(tempToken, companies[0].id);
          router.push(redirectUrl);
        } else if (companies.length > 1) {
          // If user has multiple companies, let them choose.
          setStatus('Перенаправлення на вибір компанії...');
          router.push(`/select-company?token=${tempToken}&start=${startPage}`);
        } else {
          // If user has no companies, prompt them to create one.
          setStatus('Перенаправлення на створення компанії...');
          router.push(`/create-company?token=${tempToken}&start=${startPage}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Сталася невідома помилка.');
      }
    };

    handleAuthentication();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 text-center p-4">
      <div className="flex items-center gap-4 text-lg font-semibold">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>{status}</p>
      </div>
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          <p className="font-bold">Помилка автентифікації</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
