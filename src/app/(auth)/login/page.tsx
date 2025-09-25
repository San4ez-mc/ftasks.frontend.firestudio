'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {

  const handleTestClick = async () => {
    try {
      const response = await fetch('https://9000-firebase-php-audit-1758820822645.cluster-ha3ykp7smfgsutjta5qfx7ssnm.cloudworkstations.dev/?monospaceUid=404145&embedded=0');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text(); // Use text() in case response is not JSON
      console.log('Test request successful:', data);
      alert('Тестовий запит успішно відправлено!');
    } catch (error) {
      console.error('Test request failed:', error);
      alert(`Помилка тестового запиту: ${error instanceof Error ? error.message : String(error)}`);
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
          <Button onClick={handleTestClick} variant="outline" className="w-full">
            Тестова кнопка
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
