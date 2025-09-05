
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { loginWithTelegram } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // In a real app, this data would come from the Telegram Login Widget.
      // For this prototype, we'll use mock data.
      const mockTelegramUser = {
        tgUserId: "345126254",
        username: "olexandrmatsuk",
        firstName: "Oleksandr",
        lastName: "Matsuk",
        photoUrl: "https://t.me/i/userpic/320/olexandrmatsuk.jpg"
      };

      await loginWithTelegram(mockTelegramUser);
      
      // On successful login, redirect to the company selection page.
      router.push('/select-company');

    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">FINEKO</CardTitle>
          <CardDescription>Увійдіть, щоб продовжити</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Увійти через Telegram'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
