
'use client';

import React from 'react';
import type { Position, Employee } from '@/types/org-structure';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Workflow, ClipboardList } from 'lucide-react';

interface PositionCardProps {
  position: Position;
  employees: Employee[];
  isSelected: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

export default function PositionCard({ position, employees, isSelected, onClick, onDragStart }: PositionCardProps) {
  const assignedEmployees = employees.filter(e => position.employeeIds.includes(e.id));

  return (
    <Card 
        className={cn(
            "cursor-pointer hover:shadow-md transition-shadow",
            isSelected && "ring-2 ring-primary"
        )}
        onClick={onClick}
        draggable
        onDragStart={onDragStart}
    >
      <CardContent className="p-3 space-y-2">
        <h4 className="font-semibold text-sm">{position.name}</h4>
        
        <div className="flex items-center gap-2">
            {position.linkedProcessIds > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                    <Workflow className="mr-1 h-3 w-3" /> {position.linkedProcessIds}
                </Badge>
            )}
             {position.linkedKpiIds > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                    <ClipboardList className="mr-1 h-3 w-3" /> {position.linkedKpiIds}
                </Badge>
            )}
        </div>

        <div className="flex items-center gap-2">
          {assignedEmployees.length > 0 ? (
            assignedEmployees.map(emp => (
              <Avatar key={emp.id} className="h-8 w-8">
                <AvatarImage src={emp.avatar} alt={emp.name} />
                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))
          ) : (
            <div className="h-8 flex items-center">
                <span className="text-xs text-muted-foreground">Вакантно</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
