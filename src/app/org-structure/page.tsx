
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Save, UserPlus } from 'lucide-react';
import { mockDivisions, mockDepartments, mockEmployees } from '@/data/org-structure-mock';
import type { Department, Employee, Division } from '@/types/org-structure';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function DepartmentCard({ department, employees }: { department: Department; employees: Employee[] }) {
    const manager = employees.find(e => e.id === department.managerId);
    const departmentEmployees = employees.filter(e => department.employeeIds.includes(e.id) && e.id !== department.managerId);

    return (
        <Card className="bg-background">
            <CardHeader className="p-3">
                <CardTitle className="text-base">{department.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-sm space-y-3">
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Керівник</h4>
                    {manager ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={manager.avatar} alt={manager.name} />
                                <AvatarFallback>{manager.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{manager.name}</span>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">Не призначено</p>
                    )}
                </div>

                {departmentEmployees.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Співробітники</h4>
                        <div className="space-y-2">
                        {departmentEmployees.map(emp => (
                             <div key={emp.id} className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={emp.avatar} alt={emp.name} />
                                    <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{emp.name}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                <Button variant="outline" size="sm" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" /> Додати співробітника
                </Button>
            </CardContent>
        </Card>
    )
}


export default function OrgStructurePage() {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [divisions, setDivisions] = useState<Division[]>(mockDivisions);
  
  return (
    <div className="flex-1 flex flex-col h-full bg-muted/40">
      <header className="flex-shrink-0 bg-background border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight font-headline">Організаційна структура</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Зберегти</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Експорт</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Додати</Button>
        </div>
      </header>
      
      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-flow-col auto-cols-[320px] gap-4">
            {divisions.map(division => {
                const divisionDepartments = departments.filter(d => d.divisionId === division.id);
                return (
                    <div key={division.id} className="flex flex-col gap-4">
                        <div className="p-3 bg-background rounded-lg border">
                             <h3 className="font-bold">{division.name}</h3>
                             <p className="text-xs text-muted-foreground">{division.description}</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            {divisionDepartments.map(dept => (
                                <DepartmentCard key={dept.id} department={dept} employees={employees} />
                            ))}
                        </div>
                         <Button variant="outline" className="mt-auto">
                            <Plus className="mr-2 h-4 w-4" /> Додати відділ
                        </Button>
                    </div>
                )
            })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
