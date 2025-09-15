'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, PlusCircle, Save, X, GripVertical, AlertTriangle, Lightbulb, CircleHelp, Plus, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import ProcessArrows from '@/components/processes/process-arrows';
import type { Process, Lane, Step, User, StepStatus } from '@/types/process';
import type { Section, Employee } from '@/types/org-structure';
import { updateProcess } from '@/app/(app)/processes/actions';
import { useToast } from '@/hooks/use-toast';


type ProcessEditorProps = {
    initialProcess: Process;
    users: User[];
    allSections: (Section & { departmentName: string })[];
    allEmployees: Employee[];
}

// --- Main Page Component ---

export default function ProcessEditor({ initialProcess, users, allSections, allEmployees }: ProcessEditorProps) {
  const router = useRouter();
  const [process, setProcess] = useState<Process>(initialProcess);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [draggedStep, setDraggedStep] = useState<{ stepId: string; fromLaneId: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxOrder, setMaxOrder] = useState(0);
  const [isSaving, startTransition] = useTransition();
  const { toast } = useToast();

  const allSteps = process.lanes.flatMap(lane => lane.steps);

  useEffect(() => {
    const highestOrder = Math.max(0, ...allSteps.map(s => s.order));
    setMaxOrder(highestOrder);
  }, [allSteps])

  const addNewStep = (afterStep: Step) => {
      const fromLane = process.lanes.find(l => l.steps.some(s => s.id === afterStep.id));
      if (!fromLane) return;
      
      const newStepOrder = afterStep.order + 1;

      const newStep: Step = {
        id: `step-${Date.now()}`,
        name: 'Новий крок',
        responsibleId: users[0].id,
        order: newStepOrder,
        connections: [],
        status: 'new',
        notes: ''
      };

      setProcess(prev => {
        const updatedLanes = prev.lanes.map(lane => {
            return {
                ...lane,
                steps: lane.steps.map(s => s.order >= newStepOrder ? { ...s, order: s.order + 1} : s)
            }
        });
        
        const targetLane = updatedLanes.find(l => l.id === fromLane.id);
        if(targetLane){
            targetLane.steps.push(newStep);
        }

        return { ...prev, lanes: updatedLanes };
      });
  };

  const handleStepUpdate = (updatedStep: Step) => {
      setProcess(prev => ({
          ...prev,
          lanes: prev.lanes.map(lane => ({
              ...lane,
              steps: lane.steps.map(step => step.id === updatedStep.id ? updatedStep : step)
          }))
      }));
      setEditingStep(null);
  }
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, step: Step, fromLaneId: string) => {
    setDraggedStep({ stepId: step.id, fromLaneId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toLaneId: string) => {
    e.preventDefault();
    if (!draggedStep) return;
    
    const { stepId, fromLaneId } = draggedStep;

    if (fromLaneId === toLaneId) {
        setDraggedStep(null);
        return;
    }

    let stepToMove: Step | undefined;
    const updatedLanes = process.lanes.map(lane => {
        if (lane.id === fromLaneId) {
            stepToMove = lane.steps.find(s => s.id === stepId);
            return { ...lane, steps: lane.steps.filter(s => s.id !== stepId) };
        }
        return lane;
    });

    if (stepToMove) {
        const finalLanes = updatedLanes.map(lane => {
            if (lane.id === toLaneId) {
                return { ...lane, steps: [...lane.steps, stepToMove!] };
            }
            return lane;
        });
        setProcess({ ...process, lanes: finalLanes });
    }

    setDraggedStep(null);
  };
  
  const handleSave = () => {
    startTransition(async () => {
        try {
            await updateProcess(process.id, process);
            toast({ title: "Успіх!", description: "Процес успішно збережено."});
        } catch (error) {
            console.error(error);
            toast({ title: "Помилка", description: "Не вдалося зберегти процес.", variant: "destructive" });
        }
    });
  }

  const [isDataSavePointChecked, setIsDataSavePointChecked] = useState(editingStep?.isDataSavePoint || false);

  useEffect(() => {
    setIsDataSavePointChecked(editingStep?.isDataSavePoint || false);
  }, [editingStep]);

  const handleLaneChange = (laneId: string, newSectionId: string) => {
    const section = allSections.find(s => s.id === newSectionId);
    if (!section) return;

    setProcess(prev => ({
        ...prev,
        lanes: prev.lanes.map(lane => 
            lane.id === laneId ? { ...lane, sectionId: newSectionId, role: section.name } : lane
        )
    }));
  }
  
  const groupedSections = allSections.reduce((acc, section) => {
      (acc[section.departmentName] = acc[section.departmentName] || []).push(section);
      return acc;
  }, {} as Record<string, (Section & { departmentName: string })[]>);


  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="flex-shrink-0 bg-background border-b p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="outline" size="icon" onClick={() => router.push('/processes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Input 
              value={process.name}
              onChange={(e) => setProcess({ ...process, name: e.target.value })}
              className="text-lg font-bold tracking-tight font-headline border-none shadow-none p-0 h-auto focus-visible:ring-0"
            />
             <Textarea
                value={process.description}
                onChange={(e) => setProcess({ ...process, description: e.target.value })}
                placeholder="Короткий опис процесу..."
                className="text-sm text-muted-foreground border-none shadow-none p-0 h-auto focus-visible:ring-0 resize-none mt-1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/processes')}>
            <X className="mr-2 h-4 w-4" /> Скасувати
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Зберегти
          </Button>
        </div>
      </header>

      <main ref={containerRef} className="flex-1 overflow-auto p-4 md:p-8 relative">
        <div className="inline-block min-w-full" style={{ width: `${maxOrder * (192 + 24) + 240}px` }}>
            <ProcessArrows allSteps={allSteps} containerRef={containerRef} />
            <div className="space-y-px">
                {process.lanes.map(lane => {
                    const laneSection = allSections.find(s => s.id === lane.sectionId);
                    const sectionEmployees = laneSection ? [laneSection.managerId, ...laneSection.employeeIds].map(id => allEmployees.find(e => e.id === id)).filter(Boolean) as Employee[] : allEmployees;
                    const sectionUsers = sectionEmployees.map(e => ({id: e.id, name: e.name, avatar: e.avatar || ''}));

                    return (
                        <div 
                            key={lane.id} 
                            className="flex items-start min-h-[10rem] bg-background rounded-lg border-b"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, lane.id)}
                        >
                            <div className="sticky left-0 bg-background p-4 w-48 border-r z-10 self-stretch flex items-center">
                            <Select value={lane.sectionId} onValueChange={(newSectionId) => handleLaneChange(lane.id, newSectionId)}>
                                <SelectTrigger className="font-semibold text-md h-auto p-0 border-none shadow-none focus:ring-0 w-full text-left [&>svg]:ml-auto">
                                    <SelectValue placeholder="Обрати секцію..." >
                                        {lane.role || 'Обрати секцію...'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(groupedSections).map(([deptName, sections]) => (
                                        <SelectGroup key={deptName}>
                                            <Label className="px-2 py-1.5 text-xs font-semibold">{deptName}</Label>
                                            {sections.map(sec => <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>)}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                            </div>
                            <div className="flex-1 flex items-center p-4 min-h-[10rem] relative">
                            {lane.steps.map(step => (
                                <div 
                                    key={step.id} 
                                    id={`step-${step.id}`}
                                    style={{ position: 'absolute', left: `${(step.order - 1) * (192 + 24) + 16}px`}}
                                >
                                    <StepCard 
                                        step={step} 
                                        users={sectionUsers}
                                        onDragStart={(e) => handleDragStart(e, step, lane.id)}
                                        onEditClick={() => setEditingStep(step)} 
                                        onAddClick={() => addNewStep(step)}
                                        onUpdate={handleStepUpdate}
                                    />
                                </div>
                            ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      </main>

        <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Редагувати крок</DialogTitle>
                </DialogHeader>
                <form id="edit-step-form" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleStepUpdate({
                        ...editingStep!,
                        name: formData.get('stepName') as string,
                        responsibleId: formData.get('responsibleId') as string,
                        status: formData.get('status') as StepStatus,
                        notes: formData.get('notes') as string,
                        isDataSavePoint: (formData.get('isDataSavePoint') as string) === 'on',
                        dataSaveLocation: formData.get('dataSaveLocation') as string,
                    })
                }}>
                    <div className="grid gap-4 py-4 text-sm">
                        <div className="space-y-1">
                            <Label htmlFor="stepName">Назва кроку</Label>
                            <Input id="stepName" name="stepName" defaultValue={editingStep?.name} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="responsibleId">Відповідальний</Label>
                            <Select name="responsibleId" defaultValue={editingStep?.responsibleId}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="status">Статус</Label>
                            <Select name="status" defaultValue={editingStep?.status}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Новий</SelectItem>
                                    <SelectItem value="ok">OK</SelectItem>
                                    <SelectItem value="outdated">Застарілий</SelectItem>
                                    <SelectItem value="problematic">Проблемний</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="notes">Нотатки</Label>
                            <Textarea id="notes" name="notes" defaultValue={editingStep?.notes} />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isDataSavePoint" name="isDataSavePoint" defaultChecked={editingStep?.isDataSavePoint} onChange={(e) => setIsDataSavePointChecked(e.target.checked)} />
                            <Label htmlFor="isDataSavePoint">Крок збереження даних</Label>
                        </div>
                        {isDataSavePointChecked && (
                            <div className="space-y-1 pl-6">
                                <Label htmlFor="dataSaveLocation">Місце збереження даних</Label>
                                <Input id="dataSaveLocation" name="dataSaveLocation" defaultValue={editingStep?.dataSaveLocation} placeholder="Наприклад, Google Sheet 'Leads'"/>
                            </div>
                        )}
                    </div>
                </form>
                 <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setEditingStep(null)}>Скасувати</Button>
                    <Button type="submit" form="edit-step-form">Зберегти</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

// --- Step Card Component ---

const statusConfig: Record<StepStatus, { icon: React.ElementType, color: string, label: string }> = {
    new: { icon: Lightbulb, color: 'text-blue-500', label: 'Новий' },
    ok: { icon: () => null, color: '', label: 'OK' },
    outdated: { icon: CircleHelp, color: 'text-yellow-500', label: 'Застарілий' },
    problematic: { icon: AlertTriangle, color: 'text-red-500', label: 'Проблемний' },
}

function StepCard({ step, users, onEditClick, onAddClick, onDragStart, onUpdate }: { 
    step: Step; 
    users: User[];
    onEditClick: () => void;
    onAddClick: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onUpdate: (step: Step) => void;
}) {
    const responsible = users.find(u => u.id === step.responsibleId);
    const StatusIcon = statusConfig[step.status].icon;
    const statusColor = statusConfig[step.status].color;

    const handleResponsibleChange = (newResponsibleId: string) => {
        onUpdate({ ...step, responsibleId: newResponsibleId });
    }

    const CardContent = (
        <div 
            className="group relative bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-48"
            onClick={onEditClick}
            draggable
            onDragStart={onDragStart}
        >
            <div className="absolute z-10 top-1/2 -translate-y-1/2 -left-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-card/50 rounded-full">
                <GripVertical className="h-4 w-4" />
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1">
                {step.isDataSavePoint && (
                    <Popover>
                        <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent className="text-xs max-w-sm">
                            <p className="font-bold">Місце збереження:</p>
                            <p>{step.dataSaveLocation || 'Не вказано'}</p>
                        </PopoverContent>
                    </Popover>
                )}
                {step.status !== 'ok' && (
                     <Popover>
                        <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                            <StatusIcon className={cn("h-4 w-4", statusColor)} />
                        </PopoverTrigger>
                        <PopoverContent className="text-xs w-auto p-2">
                            {statusConfig[step.status].label}
                        </PopoverContent>
                    </Popover>
                )}
            </div>
            
            <p className="font-medium text-sm mb-2 pr-4">{step.name}</p>
            <div onClick={e => e.stopPropagation()}>
                <Select value={step.responsibleId} onValueChange={handleResponsibleChange}>
                    <SelectTrigger className="h-8 border-none p-0 focus:ring-0">
                        <SelectValue asChild>
                           <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={responsible?.avatar} />
                                    <AvatarFallback className="text-xs">{responsible?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{responsible?.name}</span>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                         {users.map(u => 
                            <SelectItem key={u.id} value={u.id}>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6"><AvatarImage src={u.avatar} /></Avatar>
                                    <span>{u.name}</span>
                                </div>
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
            
             <button
                onClick={(e) => { e.stopPropagation(); onAddClick(); }}
                className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex z-10"
                title="Додати наступний крок"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    )

    if (step.notes) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    {CardContent}
                </PopoverTrigger>
                <PopoverContent className="text-xs max-w-sm">
                    <p className="font-bold">Нотатки:</p>
                    <p>{step.notes}</p>
                </PopoverContent>
            </Popover>
        )
    }

    return CardContent;
}
