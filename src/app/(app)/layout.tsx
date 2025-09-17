
import type { ReactNode } from 'react';
import { getUserSession } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import AppShell from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  const userIsAdmin = session ? await isAdmin(session.userId, session.companyId) : false;

  return <AppShell userIsAdmin={userIsAdmin}>{children}</AppShell>;
}
