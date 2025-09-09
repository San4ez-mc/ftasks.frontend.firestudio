
import { Suspense } from 'react';
import ProcessEditor from './_components/ProcessEditor';
import { Loader2 } from 'lucide-react';

// Mock data fetching function. In a real app, this would fetch from an API or database.
import { mockInitialProcess, mockUsers } from '@/data/process-mock';
import type { Process, User } from '@/types/process';

async function getProcessData(id: string): Promise<{ process: Process, users: User[] }> {
    // Here you would fetch the process by its ID.
    // We'll return the mock data for now.
    console.log(`Fetching data for process: ${id}`);
    return Promise.resolve({ process: mockInitialProcess, users: mockUsers });
}


// This is now an async Server Component, which correctly handles async params.
export default async function EditProcessPage({ params }: { params: { id: string } }) {
  // We can safely fetch data on the server before rendering.
  const { process, users } = await getProcessData(params.id);

  return (
    // The Suspense boundary is good practice for components that fetch data.
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
