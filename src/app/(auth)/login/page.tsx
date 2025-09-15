
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';


// The URL for the Telegram bot authentication.
const TELEGRAM_BOT_BASE_URL = "https://t.me/FinekoTasks_Bot";

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);

  const getAuthUrl = () => {
    // We pass the "remember me" choice in the payload of the start command.
    const payload = rememberMe ? 'auth_remember' : 'auth';
    return `${TELEGRAM_BOT_BASE_URL}?start=${payload}`;
  };

  const handleQuickLogin = () => {
    // This is a temporary developer-only function.
    // It uses a hardcoded, non-revocable token for local testing.
    // This token corresponds to user-1 (Oleksandr Matsuk), company-1 and is signed with the dev secret.
    const MOCK_PERMANENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJjb21wYW55SWQiOiJjb21wYW55LTEiLCJyZW1lbWJlck1lIjp0cnVlLCJpYXQiOjE3MjYzNTg4MDB9.d7yK_d-pr2B8pE4Pz5z3yW7n0tF7b_k9T8V4qM6rZ0s";
    
    // Set token in both localStorage (for client-side API calls) and cookies (for middleware)
    localStorage.setItem('auth_token', MOCK_PERMANENT_TOKEN);
    document.cookie = `auth_token=${MOCK_PERMANENT_TOKEN}; path=/; max-age=2592000`; // max-age=30 days

    // Use window.location.href to force a full page reload, which is necessary for the middleware to re-evaluate the auth state.
    window.location.href = '/';
  }

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
           {/* --- Development Only Button --- */}
          <Button onClick={handleQuickLogin} variant="secondary" className="w-full">
            Швидкий вхід (для розробки)
          </Button>
          {/* ----------------------------- */}
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
