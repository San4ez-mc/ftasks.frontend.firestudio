
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  // This layout is minimal and does not include the main AppShell,
  // so pages in this group (like login) will not have the sidebar or header.
  return <>{children}</>;
}
