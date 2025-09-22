
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebarNav from '@/components/layout/admin-sidebar-nav';
import Header from '@/components/layout/header';
import { getUserSession } from '@/lib/session';
import { isAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  
  // This check will now always fail because isAdmin is disabled,
  // effectively protecting the admin routes.
  if (!session || !(await isAdmin(session.userId, session.companyId))) {
    redirect('/');
  }

  // This code will not be reached, but is kept for future re-enabling.
  const userIsAdmin = true; 

  return (
    <SidebarProvider>
      <Sidebar>
        <AdminSidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header userIsAdmin={userIsAdmin} />
        <main className="flex-1 overflow-y-auto bg-muted/40">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
