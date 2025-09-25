
import type { ReactNode } from 'react';
import AppShell from '@/components/layout/app-shell';

// Removed server-side session validation from the layout.
// Client components will now be responsible for fetching user data
// and handling redirects if the session is invalid, which is a more
// robust pattern when dealing with external API-based authentication.

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
