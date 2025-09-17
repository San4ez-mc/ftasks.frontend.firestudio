
import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebarNav from '@/components/layout/admin-sidebar-nav';
import Header from '@/components/layout/header';

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
