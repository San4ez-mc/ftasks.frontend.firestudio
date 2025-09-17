'use client';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import SidebarNav from './sidebar-nav';
import Header from './header';
import { Loader2 } from 'lucide-react';

function LoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingState />}>{children}</Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
