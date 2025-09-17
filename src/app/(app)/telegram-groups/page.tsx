
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import TelegramGroupsClient from './_components/TelegramGroupsClient';

function LoadingState() {
  return (
     <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
     </div>
  )
}

export default function TelegramGroupsPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <TelegramGroupsClient />
        </Suspense>
    )
}
