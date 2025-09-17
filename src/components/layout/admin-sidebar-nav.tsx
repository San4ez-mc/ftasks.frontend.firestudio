
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Building,
  CreditCard,
  Shield
} from 'lucide-react';

const menuItems = [
  { href: '/admin/companies', label: 'Компанії', icon: Building },
  { href: '/admin/payments', label: 'Оплати', icon: CreditCard },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
           <Shield className="w-8 h-8 text-primary"/>
          <h2 className="text-xl font-semibold tracking-tight font-headline">АДМІНКА</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
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
    </>
  );
}
