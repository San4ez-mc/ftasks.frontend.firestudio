
import type { ReactNode } from 'react';
import AppShell from '@/components/layout/app-shell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  // The isAdmin check has been removed to prevent server crashes.
  // The userIsAdmin prop is no longer needed.
  return <AppShell>{children}</AppShell>;
}
