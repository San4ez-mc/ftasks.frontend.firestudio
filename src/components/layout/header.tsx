
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, LogOut, Settings, LifeBuoy, Shield, MessageSquareQuoteIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendSupportMessage } from '@/app/actions';


function SupportChatDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSending(true);
        const result = await sendSupportMessage(message.trim());
        setIsSending(false);

        if (result.success) {
            toast({
                title: "Повідомлення відправлено!",
                description: "Ми отримали ваш запит і скоро зв'яжемося з вами.",
            });
            setMessage('');
            onOpenChange(false);
        } else {
            toast({
                title: "Помилка",
                description: "Не вдалося відправити повідомлення. Спробуйте ще раз.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Зв'язок з тех. підтримкою</DialogTitle>
                    <DialogDescription>
                        Опишіть вашу проблему або питання, і ми зв'яжемося з вами найближчим часом.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4">
                        <Label htmlFor="support-message" className="sr-only">Ваше повідомлення</Label>
                        <Textarea
                            id="support-message"
                            placeholder="Опишіть вашу проблему тут..."
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isSending}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSending}>
                            Скасувати
                        </Button>
                        <Button type="submit" disabled={isSending || !message.trim()}>
                            {isSending ? 'Відправка...' : 'Відправити'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


export default function Header() {
  const router = useRouter();
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);

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
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleStartTour}>
            <LifeBuoy className="h-5 w-5" />
            <span className="sr-only">Почати навчання</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSupportChatOpen(true)}>
            <MessageSquareQuoteIcon className="h-5 w-5" />
            <span className="sr-only">Тех. підтримка</span>
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
      <SupportChatDialog isOpen={isSupportChatOpen} onOpenChange={setIsSupportChatOpen} />
    </>
  );
}
