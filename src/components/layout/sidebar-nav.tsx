
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Workflow,
  FileClock,
  Building,
  Send,
  BookText,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { getSubscriptionStatus, type SubscriptionStatus } from '@/app/(app)/settings/billing/actions';
import { Card, CardContent } from '../ui/card';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/results', label: 'Результати', icon: Trophy },
  { href: '/', label: 'Задачі щоденні', icon: LayoutDashboard },
  { href: '/templates', label: 'Шаблони', icon: FileClock },
  { href: '/org-structure', label: 'Орг.структура', icon: Users },
  { href: '/processes', label: 'Бізнес процеси', icon: Workflow },
  { href: '/instructions', label: 'Інструкції', icon: BookText },
  { href: '/company', label: 'Компанія', icon: Building },
  { href: '/telegram-groups', label: 'Телеграм групи', icon: Send },
  { href: '/audit', label: 'Аудит', icon: ClipboardCheck },
];

function SubscriptionIndicator() {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const subStatus = await getSubscriptionStatus();
            setStatus(subStatus);
        });
    }, []);

    if (!status || isPending) {
        return null; // or a skeleton loader
    }
    
    if (status.tier === 'free') {
        return (
            <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-2 text-center">
                    <p className="text-xs font-semibold text-destructive-foreground">Тариф Безкоштовний</p>
                    <Button variant="link" size="sm" asChild className="text-xs h-auto p-0 text-destructive-foreground">
                        <Link href="/settings/billing">Оплатити</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
         <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-2 text-center">
                 <div className="flex items-center justify-center gap-1 text-primary">
                    <Sparkles className="h-3 w-3" />
                    <p className="text-xs font-semibold">{status.planName}</p>
                 </div>
                 <p className="text-xs text-primary/80">Залишилось: {status.daysRemaining} днів</p>
            </CardContent>
        </Card>
    )
}


export default function SidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [companyName, setCompanyName] = useState('My Company');

  useEffect(() => {
    // In a real app, this would be fetched from user session or API
    const storedCompanyId = localStorage.getItem('selectedCompany');
    if (storedCompanyId) {
        setCompanyName(storedCompanyId === 'company-1' ? 'Fineko Development' : 'My Startup Project');
    }
  }, []);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          <h2 className="text-xl font-semibold tracking-tight font-headline">FINEKO</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)}
                tooltip={{ children: item.label }}
                onClick={() => setOpenMobile(false)}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 space-y-2">
        <SubscriptionIndicator />
        <div className="p-2 text-sm font-medium text-muted-foreground truncate">
            {companyName}
        </div>
      </SidebarFooter>
    </>
  );
}
