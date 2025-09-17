
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, LogOut, Settings, LifeBuoy, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUserSession } from '@/lib/session';
import { isAdmin } from '@/lib/admin';

export default function Header() {
  const router = useRouter();
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
        const session = await getUserSession();
        if(session && isAdmin(session.userId)) {
            setUserIsAdmin(true);
        }
    }
    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
    // Use window.location to force a full reload and clear state
    window.location.href = '/login';
  };

  const handleStartTour = () => {
    // Dispatch a custom event that the tour component on the page can listen for.
    window.dispatchEvent(new CustomEvent('start-tour'));
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleStartTour}>
          <LifeBuoy className="h-5 w-5" />
          <span className="sr-only">Почати навчання</span>
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src="https://picsum.photos/40/40" data-ai-hint="person" alt="User avatar" />
              <AvatarFallback>FT</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Мій акаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
             {userIsAdmin && (
                <DropdownMenuItem asChild>
                    <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Сторінка адміністратора</span>
                    </Link>
                </DropdownMenuItem>
             )}
            <DropdownMenuItem asChild>
              <Link href="/settings/billing">
                <Settings className="mr-2 h-4 w-4" />
                <span>Оплати</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/companies">
                <Settings className="mr-2 h-4 w-4" />
                <span>Налаштування</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Вийти</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
