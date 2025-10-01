import { Suspense } from 'react';
import TelegramCallback from './_components/TelegramCallback';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

// This is the parent Page component. It's now a server component by default.
export default function TelegramCallbackPage() {
  return (
    // Suspense is required by Next.js when a child component uses useSearchParams().
    // It shows a fallback UI while the client-side component loads.
    <Suspense fallback={<LoadingState />}>
      <TelegramCallback />
    </Suspense>
  );
}

// A simple loading component to show while Suspense is waiting.
function LoadingState() {
  return (
     <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 text-center p-4">
      <div className="flex items-center gap-4 text-lg font-semibold">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Initializing authentication...</p>
      </div>
    </div>
  )
}
