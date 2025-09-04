
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, PlusCircle, Save, X } from 'lucide-react';

// --- Mock Data for Swimlane ---

const mockUsers = [
  { id: 'user-1', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
  { id: 'user-2', name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
  { id: 'user-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
];

const mockProcess = {
  id: '1',
  name: 'Onboarding нового співробітника',
  description: 'Процес адаптації та навчання нових членів команди.',
  lanes: [
    {
      id: 'lane-1',
      role: 'HR Менеджер',
      steps: [
        { id: 'step-1', name: 'Підписання документів', responsibleId: 'user-3', order: 1, connections: [{ to: 'step-2' }] },
        { id: 'step-5', name: 'Фінальний фідбек', responsibleId: 'user-3', order: 4, connections: [] },
      ],
    },
    {
      id: 'lane-2',
      role: 'IT Спеціаліст',
      steps: [
        { id: 'step-2', name: 'Налаштування робочого місця', responsibleId: 'user-2', order: 2, connections: [{ to: 'step-3' }] },
      ],
    },
    {
      id: 'lane-3',
      role: 'Керівник команди',
      steps: [
        { id: 'step-3', name: 'Проведення першої зустрічі', responsibleId: 'user-1', order: 3, connections: [{ to: 'step-5' }] },
      ],
    },
  ],
};

type Step = typeof mockProcess.lanes[0]['steps'][0];

// --- Main Page Component ---

export default function EditProcessPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [process, setProcess] = useState(mockProcess);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);

  const allSteps = process.lanes.flatMap(lane => lane.steps);

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 bg-background border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/processes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input 
            value={process.name}
            onChange={(e) => setProcess({ ...process, name: e.target.value })}
            className="text-xl font-bold tracking-tight font-headline border-none shadow-none p-0 h-auto focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/processes')}>
            <X className="mr-2 h-4 w-4" /> Скасувати
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" /> Зберегти
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-8 relative">
          {/* Swimlane Background */}
          <div className="absolute inset-0 top-16">
              {process.lanes.map((lane, index) => (
                  <div key={lane.id} className="h-40 border-b border-dashed"></div>
              ))}
          </div>
          
          {/* Content */}
          <div className="relative z-10 space-y-4">
            {process.lanes.map(lane => (
              <div key={lane.id} className="flex items-start h-40">
                <div className="sticky left-0 bg-background pr-4 w-40">
                  <h3 className="font-semibold text-lg">{lane.role}</h3>
                </div>
                <div className="flex-1 grid grid-cols-6 gap-x-8 items-center h-full">
                  {lane.steps.map(step => (
                     <div key={step.id} className={`col-start-${step.order} col-span-1`}>
                       <StepCard step={step} />
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Connectors (SVG) - a simplified visualization */}
           <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" >
                {allSteps.map(step => (
                    step.connections.map(conn => {
                        const fromStep = allSteps.find(s => s.id === step.id);
                        const toStep = allSteps.find(s => s.id === conn.to);
                        if (!fromStep || !toStep) return null;
                        
                        const fromLaneIndex = process.lanes.findIndex(l => l.steps.some(s => s.id === fromStep.id));
                        const toLaneIndex = process.lanes.findIndex(l => l.steps.some(s => s.id === toStep.id));
                        
                        // Approximate positions - in a real app, you'd use refs and calculate precisely
                        const startX = 160 + (fromStep.order * 150);
                        const startY = 110 + (fromLaneIndex * 176);
                        const endX = 160 + (toStep.order * 150) - 100;
                        const endY = 110 + (toLaneIndex * 176);

                        return (
                            <path 
                                key={`${fromStep.id}-${toStep.id}`}
                                d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
                                stroke="hsl(var(--primary))"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrow)"
                            />
                        )
                    })
                ))}
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                        markerWidth="6" markerHeight="6"
                        orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
                    </marker>
                </defs>
            </svg>

        </div>
      </main>

       <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
          <PlusCircle className="h-8 w-8" />
          <span className="sr-only">Додати крок</span>
        </Button>
    </div>
  );
}


// --- Step Card Component ---
function StepCard({ step }: { step: Step }) {
    const responsible = mockUsers.find(u => u.id === step.responsibleId);
    return (
        <div className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-40">
            <p className="font-medium text-sm mb-2">{step.name}</p>
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={responsible?.avatar} />
                    <AvatarFallback>{responsible?.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{responsible?.name}</span>
            </div>
        </div>
    )
}

