'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function InitialLoadPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // If token exists, redirect to the main tasks page
      router.replace('/tasks');
    } else {
      // If no token, redirect to the login page
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Завантаження...</p>
      </div>
    </div>
  );
}
