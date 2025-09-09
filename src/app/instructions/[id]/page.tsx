
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Users, Settings, Eye, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// This is a mock data structure. In a real app, you'd fetch this.
const mockInstruction = {
  id: '1',
  title: 'Як користуватися CRM',
  department: 'Відділ продажів',
  content: '<h1>Загальні правила</h1><p>Завжди заповнюйте всі поля...</p>',
  accessList: [
    { userId: 'user-1', access: 'edit' },
    { userId: 'user-2', access: 'view' },
  ],
};

type EditInstructionPageProps = {
  params: {
    id: string;
  };
};

export default function EditInstructionPage({ params }: EditInstructionPageProps) {
  const router = useRouter();
  const instruction = mockInstruction; // Use mock data

  if (!instruction) {
    return <div>Instruction not found</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/instructions')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              defaultValue={instruction.title}
              className="text-lg font-bold tracking-tight font-headline border-none shadow-none p-0 h-auto focus-visible:ring-0"
            />
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" /> Зберегти
          </Button>
        </header>
        <div className="flex-1 p-4 md:p-8">
            {/* This is a placeholder for a rich text editor like Tiptap or TinyMCE */}
            <Textarea 
                className="w-full h-full min-h-[60vh] text-base"
                defaultValue={instruction.content.replace(/<[^>]+>/g, '')} // Simple HTML strip for textarea
            />
        </div>
      </div>
      
      {/* Right Panel: Settings */}
      <aside className="w-full md:w-80 bg-card border-l p-6 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-5 w-5"/>
                    Налаштування
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <label htmlFor="department" className="text-sm font-medium">Відділ</label>
                    <Input id="department" defaultValue={instruction.department} />
                 </div>
                 <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4"/> Видалити інструкцію
                 </Button>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5"/>
                    Доступи
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {instruction.accessList.map(access => (
                    <div key={access.userId} className="flex items-center justify-between text-sm">
                        <span>User {access.userId}</span>
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground"/>
                            <span>{access.access}</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </aside>
    </div>
  );
}

