
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebarNav from '@/components/layout/admin-sidebar-nav';
import Header from '@/components/layout/header';
import { getUserSession } from '@/lib/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  
  // The admin check is temporarily removed. We only check for a valid session.
  if (!session) {
    redirect('/login');
  }

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
