
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebarNav from '@/components/layout/admin-sidebar-nav';
import Header from '@/components/layout/header';
import { getUserSession } from '@/lib/session';
import { isAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getUserSession();
  
  // Perform the admin check here, in a Node.js environment, instead of the middleware.
  if (!session || !(await isAdmin(session.userId, session.companyId))) {
    redirect('/');
  }

  const userIsAdmin = true; // We know they are an admin if they reach this point

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
