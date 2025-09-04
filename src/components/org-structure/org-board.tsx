
'use client';

import React, { useState } from 'react';
import type { Division, Position, Employee } from '@/types/org-structure';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import PositionCard from './position-card';
import DetailsPanel from './details-panel';

interface OrgBoardProps {
  divisions: Division[];
  positions: Position[];
  employees: Employee[];
  onPositionUpdate: (position: Position) => void;
  onDragEnd: (positionId: string, newDivisionId: string) => void;
}

export default function OrgBoard({ divisions, positions, employees, onPositionUpdate, onDragEnd }: OrgBoardProps) {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [draggedPositionId, setDraggedPositionId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, positionId: string) => {
    setDraggedPositionId(positionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, divisionId: string) => {
    e.preventDefault();
    if (draggedPositionId) {
      onDragEnd(draggedPositionId, divisionId);
    }
    setDraggedPositionId(null);
  };
  
  const selectedPosition = positions.find(p => p.id === selectedPositionId);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-4 grid grid-flow-col auto-cols-[280px] gap-4">
            {divisions.map(division => {
              const divisionPositions = positions.filter(p => p.divisionId === division.id);
              return (
                <div 
                  key={division.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, division.id)}
                  className="flex flex-col"
                >
                  <Card className="flex-shrink-0 mb-2 bg-muted/40">
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">{division.name}</CardTitle>
                      <CardDescription className="text-xs">{division.description}</CardDescription>
                    </CardHeader>
                  </Card>
                  <div className="flex flex-col gap-3">
                    {divisionPositions.map(pos => (
                      <PositionCard
                        key={pos.id}
                        position={pos}
                        employees={employees}
                        isSelected={selectedPositionId === pos.id}
                        onClick={() => setSelectedPositionId(pos.id)}
                        onDragStart={(e) => handleDragStart(e, pos.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <div className={cn(
          "bg-card border-l transition-all duration-300 ease-in-out overflow-hidden",
          selectedPosition ? "w-full md:w-[380px]" : "w-0"
      )}>
        {selectedPosition && (
            <DetailsPanel 
                key={selectedPosition.id}
                position={selectedPosition}
                allEmployees={employees}
                onUpdate={onPositionUpdate}
                onClose={() => setSelectedPositionId(null)}
            />
        )}
      </div>
    </div>
  );
}
