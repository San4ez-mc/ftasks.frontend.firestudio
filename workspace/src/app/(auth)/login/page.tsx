
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { setAuthToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!token.trim()) {
      setError('Будь ласка, вставте ваш токен доступу.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await setAuthToken(token);
      if (result.success) {
        // On success, redirect to the main application page
        router.push('/');
      } else {
        setError('Не вдалося встановити токен. Можливо, він недійсний.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сталася невідома помилка.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-headline">Вхід у систему</CardTitle>
          <CardDescription>
            Будь ласка, вставте токен доступу, який ви отримали від Telegram-бота.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="jwt-token">Токен доступу (JWT)</Label>
              <Input
                id="jwt-token"
                name="jwt-token"
                type="password"
                placeholder="Вставте ваш токен сюди..."
                required
                disabled={isSubmitting}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Увійти
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
