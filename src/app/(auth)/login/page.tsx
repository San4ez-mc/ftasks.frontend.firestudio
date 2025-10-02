'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">FINEKO</CardTitle>
          <CardDescription>
            Система управління задачами та проєктами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link href="https://t.me/FinekoTasks_Bot?start=tasks">
              Увійти через Telegram
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
