
import type { ReactNode } from 'react';
import AppShell from '@/components/layout/app-shell';
import { getUserSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  if (!session) {
    redirect('/login');
  }
  return <AppShell>{children}</AppShell>;
}
