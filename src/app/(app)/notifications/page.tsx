
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight font-headline">Сповіщення</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Історія сповіщень</CardTitle>
          <CardDescription>
            Тут будуть відображатися важливі оновлення та події.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
            <Bell className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Сповіщень поки що немає</p>
            <p className="text-sm">Коли щось трапиться, ви побачите це тут.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
