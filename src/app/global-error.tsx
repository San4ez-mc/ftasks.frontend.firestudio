
'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { reportClientError } from './actions'; // Import the new server action

/**
 * A global error boundary for the Next.js App Router.
 * It catches any unhandled client-side exceptions, displays a user-friendly
 * fallback UI, and reports the error details to the server.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hasReported = useRef(false);

  useEffect(() => {
    // This effect runs when an error is caught.
    // It reports the error to the server for logging/notification.
    if (!hasReported.current) {
        hasReported.current = true; // Prevent sending multiple reports for the same error
        reportClientError({
            message: error.message,
            stack: error.stack,
            page: window.location.href, // Add context about where the error happened
            digest: error.digest,
        });
    }
    console.error("Caught a global client-side error:", error); // Also log to the browser console
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <div className="text-center max-w-lg">
                <h2 className="text-2xl font-bold text-destructive mb-4">Сталася помилка</h2>
                <p className="mb-6 text-muted-foreground">
                    На жаль, у додатку виникла непередбачена помилка. Звіт про цю проблему вже автоматично надіслано.
                    Спробуйте оновити сторінку або повернутися на головну.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => reset()}>Спробувати ще раз</Button>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>На головну</Button>
                </div>
                <details className="mt-8 text-left text-xs bg-muted p-2 rounded-md">
                    <summary className="cursor-pointer">Технічні деталі</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words">
                        <code>
                            {error.message}
                            {error.digest && `\n\nDigest: ${error.digest}`}
                            {error.stack && `\n\n${error.stack}`}
                        </code>
                    </pre>
                </details>
            </div>
        </div>
      </body>
    </html>
  );
}
