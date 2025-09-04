
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LifeBuoy, Lightbulb, CheckCircle } from 'lucide-react';
import { getHelpContent } from '@/app/actions';
import type { HelpContentOutput } from '@/ai/flows/ai-help-assistant';
import { Skeleton } from '../ui/skeleton';

type HelpAssistantProps = {
  pageName: string;
};

export default function HelpAssistant({ pageName }: HelpAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<HelpContentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `help-assistant-visited-${pageName}`;

  useEffect(() => {
    const hasVisited = localStorage.getItem(storageKey);
    if (!hasVisited) {
      setIsOpen(true);
      localStorage.setItem(storageKey, 'true');
    }
  }, [storageKey]);

  useEffect(() => {
    if (isOpen) {
      const fetchHelpContent = async () => {
        setIsLoading(true);
        setError(null);
        const result = await getHelpContent(pageName);
        if (result.success && result.data) {
          setContent(result.data);
        } else {
          setError(result.error || 'Не вдалося завантажити довідку.');
        }
        setIsLoading(false);
      };
      fetchHelpContent();
    }
  }, [isOpen, pageName]);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-20"
        onClick={() => setIsOpen(true)}
      >
        <LifeBuoy className="h-8 w-8" />
        <span className="sr-only">Допомога</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {isLoading ? (
                <Skeleton className="h-6 w-3/4" />
            ) : (
                <DialogTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    {content?.title || 'Допомога'}
                </DialogTitle>
            )}
            {isLoading ? (
                 <div className="space-y-2 pt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                 </div>
            ): (
                 <DialogDescription className="pt-2 text-foreground">
                    {content?.description || error}
                 </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="font-semibold mb-2 text-sm">Основні дії:</h3>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                </div>
            ) : (
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {content?.actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        <span>{action}</span>
                    </li>
                    ))}
                </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
