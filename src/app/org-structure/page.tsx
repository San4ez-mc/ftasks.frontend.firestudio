
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockDivisions, mockPositions, mockEmployees } from '@/data/org-structure-mock';
import type { Position, Employee, Division } from '@/types/org-structure';
import OrgBoard from '@/components/org-structure/org-board';

export default function OrgStructurePage() {
  const [positions, setPositions] = useState<Position[]>(mockPositions);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [divisions, setDivisions] = useState<Division[]>(mockDivisions);
  const [activeTab, setActiveTab] = useState('org-board');

  const handlePositionUpdate = (updatedPosition: Position) => {
    setPositions(prev => prev.map(p => p.id === updatedPosition.id ? updatedPosition : p));
  };

  const handleDragEnd = (positionId: string, newDivisionId: string) => {
    setPositions(prev => prev.map(p => p.id === positionId ? { ...p, divisionId: newDivisionId } : p));
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex-shrink-0 bg-background border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight font-headline">Організаційна структура</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Зберегти</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Експорт</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Додати</Button>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
            <TabsList>
                <TabsTrigger value="org-board">Org Board</TabsTrigger>
                <TabsTrigger value="hierarchy">Ієрархія</TabsTrigger>
                <TabsTrigger value="metrics">Показники</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="org-board" className="flex-1 overflow-hidden mt-0">
          <OrgBoard 
            divisions={divisions}
            positions={positions}
            employees={employees}
            onPositionUpdate={handlePositionUpdate}
            onDragEnd={handleDragEnd}
          />
        </TabsContent>
        <TabsContent value="hierarchy" className="flex-1 p-4">
            <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Ієрархія (дерево) буде реалізована незабаром.</p>
            </div>
        </TabsContent>
        <TabsContent value="metrics" className="flex-1 p-4">
             <div className="flex items-center justify-center h-full border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Показники будуть реалізовані незабаром.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
