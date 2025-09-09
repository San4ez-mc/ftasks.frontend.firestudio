
import { Suspense } from 'react';
import ProcessEditor from './_components/ProcessEditor';
import { Loader2 } from 'lucide-react';

// Mock data fetching function. In a real app, this would fetch from an API or database.
import { mockInitialProcess, mockUsers } from '@/data/process-mock';
import type { Process, User } from '@/types/process';

// This is the main page component. It's now an async Server Component.
// It extracts params and passes them down to the client component.
export default async function EditProcessPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the promise to get the actual params
  const { id } = await params;
  
  // In a real app, you would fetch the process data based on the id.
  // For now, we use mock data.
  const { process, users } = { process: mockInitialProcess, users: mockUsers };

  return (
    <Suspense fallback={<LoadingState />}>
      <ProcessEditor initialProcess={process} users={users} />
    </Suspense>
  );
}

function LoadingState() {
  return (
     <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
     </div>
  )
}
