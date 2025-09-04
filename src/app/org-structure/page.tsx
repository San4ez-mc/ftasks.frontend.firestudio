'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const initialStructure = [
  { id: '1', department: 'Розробка', position: 'Frontend Developer', employee: 'Іван Петренко' },
  { id: '2', department: 'Розробка', position: 'Backend Developer', employee: 'Марія Сидоренко' },
  { id: '3', department: 'Маркетинг', position: 'Marketing Manager', employee: 'Олена Ковальчук' },
  { id: '4', department: 'Менеджмент', position: 'CEO', employee: 'Петро Іваненко' },
];

export default function OrgStructurePage() {
  const [structure, setStructure] = useState(initialStructure);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);

  const handleAddPosition = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Logic to add position
    setIsPositionDialogOpen(false);
  };
  
  const handleAddDepartment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Logic to add department
    setIsDepartmentDialogOpen(false);
  };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Організаційна структура</h1>
        <div className="flex gap-2">
          <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Додати відділ</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Додати новий відділ</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDepartment}>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="departmentName">Назва відділу</Label>
                  <Input id="departmentName" name="departmentName" placeholder="Наприклад, Продажі" />
                </div>
                <DialogFooter>
                  <Button type="submit">Зберегти</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Додати посаду</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Додати нову посаду</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPosition}>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="positionName">Назва посади</Label>
                  <Input id="positionName" name="positionName" placeholder="Наприклад, Project Manager" />
                </div>
                <DialogFooter>
                  <Button type="submit">Зберегти</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Структура компанії</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>Відділ</TableHead>
                      <TableHead>Посада</TableHead>
                      <TableHead>Співробітник</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {structure.map(item => (
                      <TableRow key={item.id}>
                      <TableCell>{item.department}</TableCell>
                      <TableCell className="font-medium">{item.position}</TableCell>
                      <TableCell>{item.employee}</TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
