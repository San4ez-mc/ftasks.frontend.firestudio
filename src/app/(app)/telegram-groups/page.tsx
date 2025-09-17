
import { Suspense } from 'react';
import TelegramGroupsClient from './_components/TelegramGroupsClient';
import { Loader2 } from 'lucide-react';

export default function TelegramGroupsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TelegramGroupsClient />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
