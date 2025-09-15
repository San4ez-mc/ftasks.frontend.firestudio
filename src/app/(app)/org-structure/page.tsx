
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Save, UserPlus, Info, Trash2, Loader2 } from 'lucide-react';
import { departmentTemplates, sectionTemplates } from '@/data/org-structure-mock';
import type { Department, Employee, Division, Section } from '@/types/org-structure';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';
import { getOrgStructureData, saveOrgData } from './actions';
import { useToast } from '@/hooks/use-toast';


// --- SectionCard Component ---
function SectionCard({ section, employees, onUpdate }: { section: Section; employees: Employee[]; onUpdate: (section: Section) => void; }) {
    const manager = employees.find(e => e.id === section.managerId);

    const handleFieldChange = (field: keyof Section, value: string | string[]) => {
        onUpdate({ ...section, [field]: value });
    };

    const handleEmployeeChange = (index: number, newEmployeeId: string) => {
        const newEmployeeIds = [...section.employeeIds];
        newEmployeeIds[index] = newEmployeeId;
        handleFieldChange('employeeIds', newEmployeeIds);
    };

    const handleAddEmployee = () => {
        const availableEmployee = employees.find(emp => !section.employeeIds.includes(emp.id) && emp.id !== section.managerId);
        if (availableEmployee) {
            handleFieldChange('employeeIds', [...section.employeeIds, availableEmployee.id]);
        }
    };

    const handleRemoveEmployee = (index: number) => {
        const newEmployeeIds = section.employeeIds.filter((_, i) => i !== index);
        handleFieldChange('employeeIds', newEmployeeIds);
    };
    
    return (
        <Card className="bg-muted/50" id={`section-card-${section.id}`}>
            <CardContent className="p-2 text-xs space-y-2">
                 <div>
                    <Label htmlFor={`name-${section.id}`} className="text-xs font-semibold text-muted-foreground">Назва секції</Label>
                    <Input 
                        id={`name-${section.id}`}
                        value={section.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="text-sm font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                    />
                 </div>
                 <div>
                    <Label htmlFor={`ckp-${section.id}`} className="text-xs font-semibold text-muted-foreground">ЦКП</Label>
                    <Textarea 
                        id={`ckp-${section.id}`}
                        placeholder="Опишіть ЦКП секції..."
                        value={section.ckp}
                        onChange={(e) => handleFieldChange('ckp', e.target.value)}
                        className="text-xs h-auto min-h-[30px] border-dashed"
                    />
                </div>
                 <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Керівник</h4>
                    <Select value={section.managerId} onValueChange={(value) => handleFieldChange('managerId', value === 'unassigned' ? '' : value)}>
                        <SelectTrigger className="h-8">
                            <SelectValue placeholder="Не призначено">
                                {manager ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5"><AvatarImage src={manager.avatar} alt={manager.name} /></Avatar>
                                        <span className="text-xs">{manager.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-xs">Не призначено</span>
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned"><span className="text-muted-foreground">Не призначено</span></SelectItem>
                            {employees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6"><AvatarImage src={emp.avatar} alt={emp.name} /></Avatar>
                                        <span>{emp.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Співробітники</h4>
                    <div className="space-y-1">
                        {section.employeeIds.map((empId, index) => {
                             const employee = employees.find(e => e.id === empId);
                             return (
                                <div key={index} className="flex items-center gap-1">
                                    <Select value={empId} onValueChange={(value) => handleEmployeeChange(index, value)}>
                                        <SelectTrigger className="h-8 flex-1">
                                            <SelectValue placeholder="Обрати...">
                                                {employee ? (
                                                     <div className="flex items-center gap-2">
                                                        <Avatar className="h-5 w-5"><AvatarImage src={employee.avatar} alt={employee.name} /></Avatar>
                                                        <span className="text-xs">{employee.name}</span>
                                                    </div>
                                                ) : <span className="text-muted-foreground text-xs">Обрати...</span>}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.filter(e => e.id !== section.managerId).map(emp => (
                                                <SelectItem key={emp.id} value={emp.id} disabled={section.employeeIds.includes(emp.id) && emp.id !== empId}>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6"><AvatarImage src={emp.avatar} alt={emp.name} /></Avatar>
                                                        <span>{emp.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveEmployee(index)}>
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                </div>
                             )
                        })}
                    </div>
                </div>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={handleAddEmployee}>
                    <UserPlus className="mr-2 h-3 w-3" /> Додати співробітника
                </Button>
            </CardContent>
        </Card>
    );
}


// --- DepartmentCard Component ---
function DepartmentCard({ department, onUpdate, onDragStart, allEmployees }: { department: Department; onUpdate: (dept: Department) => void; onDragStart: (e: React.DragEvent) => void; allEmployees: Employee[] }) {
    
    const handleFieldChange = (field: keyof Department, value: string) => {
        onUpdate({ ...department, [field]: value });
    };

    const handleSectionUpdate = (updatedSection: Section) => {
        const newSections = department.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
        onUpdate({ ...department, sections: newSections });
    };

    const handleAddSection = (name: string, ckp: string) => {
        const newSection: Section = {
            id: `sec-${Date.now()}`,
            name,
            ckp,
            managerId: '',
            employeeIds: []
        };
        onUpdate({ ...department, sections: [...department.sections, newSection] });
    };

    return (
        <Card 
            id={`department-card-${department.id}`}
            className="bg-background cursor-grab"
            draggable
            onDragStart={onDragStart}
        >
            <CardContent className="p-3 text-sm space-y-3">
                 <div>
                    <Label htmlFor={`dept-name-${department.id}`} className="text-xs font-semibold text-muted-foreground">Назва відділу</Label>
                    <Input 
                        id={`dept-name-${department.id}`}
                        value={department.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="text-base font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    />
                 </div>
                 <div className="flex items-center gap-1">
                    <Label htmlFor={`ckp-${department.id}`} className="text-xs font-semibold text-muted-foreground">ЦКП відділу</Label>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p className="font-bold">Цінний Кінцевий Продукт (ЦКП)</p>
                                <p>Це результат діяльності, який є корисним для зовнішнього або внутрішнього клієнта.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Textarea 
                    id={`ckp-${department.id}`}
                    placeholder="Опишіть ЦКП відділу..."
                    value={department.ckp}
                    onChange={(e) => handleFieldChange('ckp', e.target.value)}
                    className="text-xs h-auto min-h-[40px] border-dashed"
                />
                <div className="space-y-2">
                    {department.sections.map(section => (
                        <SectionCard 
                            key={section.id}
                            section={section}
                            employees={allEmployees}
                            onUpdate={handleSectionUpdate}
                        />
                    ))}
                </div>
                 <AddSectionControl 
                    departmentId={department.id}
                    onAddSection={handleAddSection}
                />
            </CardContent>
        </Card>
    )
}

// --- TOUR STEPS ---

const orgStructureTourSteps: TourStep[] = [
    {
        elementId: 'division-column-div-1',
        title: 'Відділення (Колонки)',
        content: 'Це основні підрозділи вашої компанії. Ви можете бачити, які відділи належать до кожного відділення.',
        placement: 'right'
    },
    {
        elementId: 'department-card-dept-1',
        title: 'Картка Відділу',
        content: 'Кожна картка представляє відділ. Тут ви можете редагувати назву, ЦКП, та додавати секції. Перетягуйте картки між відділеннями, щоб змінити структуру.',
        placement: 'bottom'
    },
    {
        elementId: 'add-department-button-div-1',
        title: 'Додавання нового відділу',
        content: 'Натисніть цю кнопку, щоб додати новий відділ до відповідного відділення.',
        placement: 'top'
    },
    {
        elementId: 'section-card-sec-1',
        title: 'Керування секціями',
        content: 'Секції - це підрозділи відділу. Тут ви призначаєте керівника та співробітників, а також визначаєте їх ЦКП.',
        placement: 'top'
    },
];


export default function OrgStructurePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [draggedDeptId, setDraggedDeptId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);
  const [draggedItemHeight, setDraggedItemHeight] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
        try {
            const { divisions, departments, employees } = await getOrgStructureData();
            setDivisions(divisions);
            setDepartments(departments);
            setEmployees(employees);
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося завантажити орг. структуру.", variant: "destructive"});
        }
    });
  }, [toast]);

  const handleAddDepartment = (divisionId: string, name?: string, ckp?: string) => {
    const newDepartment: Department = {
        id: `dept-${Date.now()}`,
        name: name || 'Новий відділ',
        divisionId: divisionId,
        ckp: ckp || '',
        sections: [],
    };
    setDepartments(prev => [...prev, newDepartment]);
  };

  const handleDepartmentUpdate = (updatedDept: Department) => {
    setDepartments(prev => prev.map(d => d.id === updatedDept.id ? updatedDept : d));
  };
  
  const handleDragStart = (e: React.DragEvent, deptId: string) => {
    setDraggedDeptId(deptId);
    setDraggedItemHeight(e.currentTarget.clientHeight);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, divisionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if(divisionId !== isDraggingOver) {
        setIsDraggingOver(divisionId);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    setIsDraggingOver(null);
  }

  const handleDrop = (e: React.DragEvent, toDivisionId: string) => {
    e.preventDefault();
    if (draggedDeptId) {
        setDepartments(prev => 
            prev.map(d => 
                d.id === draggedDeptId ? { ...d, divisionId: toDivisionId } : d
            )
        );
    }
    setDraggedDeptId(null);
    setIsDraggingOver(null);
    setDraggedItemHeight(0);
  };
  
  const handleSaveChanges = () => {
    startTransition(async () => {
        try {
            await saveOrgData(divisions, departments);
            toast({ title: "Успіх!", description: "Організаційну структуру збережено."});
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося зберегти зміни.", variant: "destructive"});
        }
    });
  };

  const firstDeptId = departments[0]?.id || 'dept-1';
  const firstSectionId = departments[0]?.sections[0]?.id || 'sec-1';


  return (
    <div className="flex-1 flex flex-col h-full bg-muted/40">
       <InteractiveTour pageKey="org-structure" steps={[
            ...orgStructureTourSteps,
            {...orgStructureTourSteps[1], elementId: `department-card-${firstDeptId}`},
            {...orgStructureTourSteps[3], elementId: `section-card-${firstSectionId}`}
       ]} />
      <header className="flex-shrink-0 bg-background border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight font-headline">Організаційна структура</h1>
        <div className="flex items-center gap-2">
          <Button onClick={handleSaveChanges} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Зберегти
          </Button>
        </div>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-row items-start gap-4">
            {isPending && divisions.length === 0 ? <Loader2 className="mx-auto my-12 h-8 w-8 animate-spin" /> :
            divisions.sort((a, b) => a.order - b.order).map(division => {
                const divisionDepartments = departments.filter(d => d.divisionId === division.id);
                return (
                    <div 
                        key={division.id} 
                        id={`division-column-${division.id}`}
                        className="flex flex-col gap-4 p-2 rounded-lg bg-background/50 border self-stretch"
                        onDragOver={(e) => handleDragOver(e, division.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, division.id)}
                    >
                        <div className="p-3 bg-background rounded-lg border">
                             <h3 className="font-bold">{division.name}</h3>
                             <p className="text-xs text-muted-foreground">{division.description}</p>
                        </div>

                        <div className="flex-1 flex flex-row gap-4 items-start">
                            {divisionDepartments.map(dept => (
                                <div key={dept.id} className="w-80">
                                    <DepartmentCard 
                                        department={dept} 
                                        onUpdate={handleDepartmentUpdate}
                                        onDragStart={(e) => handleDragStart(e, dept.id)}
                                        allEmployees={employees}
                                    />
                                </div>
                            ))}
                            <div className="w-80">
                                <AddDepartmentControl
                                    id={`add-department-button-${division.id}`} 
                                    divisionId={division.id} 
                                    onAddDepartment={handleAddDepartment} 
                                 />
                            </div>
                        </div>

                        {isDraggingOver === division.id && (
                             <div 
                                className="w-full rounded-lg border-2 border-dashed border-primary bg-primary/10 transition-all"
                                style={{ height: `${draggedItemHeight}px` }}
                             ></div>
                        )}
                    </div>
                )
            })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}


function AddDepartmentControl({ id, divisionId, onAddDepartment }: { id: string, divisionId: string, onAddDepartment: (divisionId: string, name?: string, ckp?: string) => void }) {
    const templates = departmentTemplates[divisionId] || [];

    return (
       <div className="p-4 rounded-lg border-2 border-dashed h-full flex flex-col justify-center items-center">
             <p className="font-semibold mb-4 text-center">Додати новий відділ</p>
            <div className="w-full space-y-2">
                 {templates.map(template => (
                    <Button key={template.name} variant="secondary" size="sm" className="w-full justify-start h-auto py-2" onClick={() => onAddDepartment(divisionId, template.name, template.ckp)}>
                       <Plus className="mr-2 h-4 w-4" /> 
                       <span className="whitespace-normal text-left">{template.name}</span>
                    </Button>
                ))}
                <Button id={id} variant="outline" className="w-full" onClick={() => onAddDepartment(divisionId)}>
                    <Plus className="mr-2 h-4 w-4" /> Створити пустий відділ
                </Button>
            </div>
        </div>
    )
}

function AddSectionControl({ departmentId, onAddSection }: { departmentId: string; onAddSection: (name: string, ckp: string) => void }) {
    const templates = sectionTemplates[departmentId] || [];
    
    return (
        <div className="mt-auto space-y-2">
            {templates.length > 0 && (
                 <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-semibold">Додати секцію:</p>
                    {templates.map(template => (
                        <Button key={template.name} variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => onAddSection(template.name, template.ckp)}>
                           <Plus className="mr-2 h-3 w-3" /> {template.name}
                        </Button>
                    ))}
                </div>
            )}
            <Button variant="outline" className="w-full h-8 text-xs" onClick={() => onAddSection('Нова секція', '')}>
                <Plus className="mr-2 h-3 w-3" /> Додати свою секцію
            </Button>
        </div>
    )
}
