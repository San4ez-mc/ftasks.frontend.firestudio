

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// The URL for the Telegram bot authentication.
// Replace with your actual bot URL if it's different.
const TELEGRAM_BOT_AUTH_URL = "https://t.me/FinekoTasks_Bot?start=auth";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">FINEKO</CardTitle>
          <CardDescription>Увійдіть, щоб продовжити</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Use a simple link to redirect to the bot */}
          <Button asChild className="w-full">
            <Link href={TELEGRAM_BOT_AUTH_URL}>
              Увійти через Telegram
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
