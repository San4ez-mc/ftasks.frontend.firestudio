import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebarNav from '@/components/layout/admin-sidebar-nav';
import Header from '@/components/layout/header';
// Note: The isAdmin check is now the responsibility of the external backend.
// The frontend should attempt to load the page, and if the backend returns a 403 Forbidden,
// it should handle it gracefully (e.g., show an "Access Denied" message or redirect).
// This layout no longer performs a hard redirect.

export default function AdminLayout({ children }: { children: ReactNode }) {

  return (
    <SidebarProvider>
      <Sidebar>
        <AdminSidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
