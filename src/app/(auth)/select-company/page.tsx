
import { Suspense } from 'react';
import SelectCompanyForm from './_components/SelectCompanyForm';
import { Loader2 } from 'lucide-react';

export default function SelectCompanyPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <SelectCompanyForm />
        </Suspense>
    )
}

function LoadingState() {
  return (
     <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
     </div>
  )
}
