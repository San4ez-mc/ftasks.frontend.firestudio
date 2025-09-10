
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';

// The URL for the Telegram bot authentication.
const TELEGRAM_BOT_BASE_URL = "https://t.me/FinekoTasks_Bot";

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);

  const getAuthUrl = () => {
    // We pass the "remember me" choice in the payload of the start command.
    const payload = rememberMe ? 'auth_remember' : 'auth';
    return `${TELEGRAM_BOT_BASE_URL}?start=${payload}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">FINEKO</CardTitle>
          <CardDescription>Увійдіть, щоб продовжити</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href={getAuthUrl()}>
              Увійти через Telegram
            </Link>
          </Button>
          <div className="flex items-center space-x-2">
            <Label
              htmlFor="remember-me"
              className="flex items-center gap-2 text-sm font-normal cursor-pointer"
            >
              <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(!!checked)} />
              Запам'ятати мене
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
