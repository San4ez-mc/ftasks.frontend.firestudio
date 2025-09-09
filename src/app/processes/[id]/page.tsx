
'use client';

import { Suspense } from 'react';
import ProcessEditor from './_components/ProcessEditor';
import { Loader2 } from 'lucide-react';

// Mock data fetching function. In a real app, this would fetch from an API or database.
import { mockInitialProcess, mockUsers } from '@/data/process-mock';
import type { Process, User } from '@/types/process';

// This is the client-side data fetching and rendering component.
function EditProcessPageContent({ id }: { id: string }) {
  // In a real app, you might use a hook like SWR or React Query to fetch data
  // based on the id, but for this mock, we'll just use the imported data.
  const { process, users } = { process: mockInitialProcess, users: mockUsers };
  
  console.log(`Rendering editor for process: ${id}`);
  
  return <ProcessEditor initialProcess={process} users={users} />;
}


// This is the main page component. It remains a server component by default in App Router.
// It extracts params and passes them down to the client component.
export default function EditProcessPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EditProcessPageContent id={params.id} />
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
