

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCompaniesForToken, selectCompany } from '@/lib/api';

type Company = {
  id: string;
  name: string;
};

export default function SelectCompanyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tempToken = searchParams.get('token');

    if (!tempToken) {
      setError('Authentication token is missing. Please try logging in again.');
      setIsLoading(false);
      return;
    }

    const fetchCompanies = async () => {
      try {
        const userCompanies = await getCompaniesForToken(tempToken);
        setCompanies(userCompanies);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch companies.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [searchParams]);

  const handleSelectCompany = async (companyId: string) => {
    const tempToken = searchParams.get('token');
    if (!tempToken) {
        setError("Session expired. Please log in again.");
        return;
    }
    try {
        // This API call should exchange the tempToken and companyId for a permanent session token
        await selectCompany(tempToken, companyId);
        router.push('/'); // Redirect to the main app page
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Could not select company.');
    }
  };
  
  const handleCreateCompany = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, this would be an API call to create a company
    // For now, we simulate success and redirect
    router.push('/');
  }
  
  if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (error) {
      return (
           <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-destructive">Authentication Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                         <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
                    </CardContent>
                </Card>
           </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-headline">Вибір компанії</CardTitle>
          <CardDescription>Оберіть існуючу компанію або створіть нову.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreate ? (
            <>
              <div className="space-y-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company.id)}
                    className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors"
                  >
                    {company.name}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setShowCreate(true)} className="w-full">
                Створити нову компанію
              </Button>
            </>
          ) : (
             <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                    <Label htmlFor="companyName">Назва компанії</Label>
                    <Input id="companyName" name="companyName" placeholder="Ваша компанія" required />
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Назад</Button>
                    <Button type="submit" className="flex-1">Створити та увійти</Button>
                </div>
             </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
