
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const testUrl = 'https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/';

  const handleTestRequest = async (method: 'GET' | 'POST') => {
    try {
      const options: RequestInit = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method === 'POST') {
        options.body = JSON.stringify({ message: 'Hello from Fineko' });
      }

      const response = await fetch(testUrl, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      console.log(`Test ${method} request successful:`, data);
      alert(`Тестовий ${method} запит успішно відправлено!`);
    } catch (error) {
      console.error(`Test ${method} request failed:`, error);
      alert(`Помилка тестового ${method} запиту: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">FINEKO</CardTitle>
          <CardDescription>
            Увійдіть, щоб продовжити роботу
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild className="w-full">
            <a href="https://t.me/FinekoTasks_Bot?start=auth">
              Увійти через Telegram
            </a>
          </Button>
          <Button onClick={() => handleTestRequest('GET')} variant="outline" className="w-full">
            Тестовий GET-запит
          </Button>
           <Button onClick={() => handleTestRequest('POST')} variant="outline" className="w-full">
            Тестовий POST-запит
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
