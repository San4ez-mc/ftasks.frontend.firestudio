
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Search, MoreVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';


// Mock data assuming multi-company context
// All data here belongs to the *current* company_id
const mockCompany = {
    id: 'company-a',
    name: 'Fineko'
};

const mockEmployeesData = [
    { 
        id: 'emp-1',
        telegramUserId: 'tg-123',
        telegramUsername: 'ivan_p',
        firstName: 'Іван',
        lastName: 'Петренко',
        avatar: 'https://picsum.photos/100/100?random=1',
        status: 'active',
        notes: 'Ключовий розробник, спеціалізується на React та Next.js.',
        positions: ['pos-1'],
        groups: ['grp-1'],
        synonyms: ['Ваня', 'Іван П.'],
    },
    { 
        id: 'emp-2',
        telegramUserId: 'tg-456',
        telegramUsername: 'maria_s',
        firstName: 'Марія',
        lastName: 'Сидоренко',
        avatar: 'https://picsum.photos/100/100?random=2',
        status: 'active',
        notes: 'Менеджер проектів, відповідає за комунікацію з клієнтами.',
        positions: ['pos-3'],
        groups: ['grp-1', 'grp-2'],
        synonyms: ['Маша'],
    },
     { 
        id: 'emp-3',
        telegramUserId: 'tg-789',
        telegramUsername: 'olena_k',
        firstName: 'Олена',
        lastName: 'Ковальчук',
        avatar: 'https://picsum.photos/100/100?random=3',
        status: 'vacation',
        notes: '',
        positions: ['pos-4'],
        groups: [],
        synonyms: [],
    },
];

const mockPositions = [
    { id: 'pos-1', name: 'Frontend Developer' },
    { id: 'pos-2', name: 'Backend Developer' },
    { id: 'pos-3', name: 'Project Manager' },
    { id: 'pos-4', name: 'Marketing Manager' },
];

const mockGroups = [
    { id: 'grp-1', name: 'Основна команда розробки' },
    { id: 'grp-2', name: 'Менеджмент' },
];

type Employee = typeof mockEmployeesData[0];


export default function CompanyPage() {
    const [companyName, setCompanyName] = useState(mockCompany.name);
    const [employees, setEmployees] = useState(mockEmployeesData);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    
    const handleEmployeeUpdate = (updatedEmployee: Employee) => {
        setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
        setSelectedEmployee(updatedEmployee);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Employee List */}
            <div className="w-full md:w-1/3 lg:w-1/4 border-r flex flex-col">
                <header className="p-4 border-b">
                    <Input 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="text-lg font-bold tracking-tight font-headline border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    />
                     <div className="relative mt-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Пошук співробітників..." className="pl-8" />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto">
                    {employees.map(emp => {
                        const employeePositions = emp.positions.map(pId => mockPositions.find(p => p.id === pId)?.name).filter(Boolean);
                        return (
                        <button 
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className={cn(
                                "flex items-start gap-3 p-3 text-left w-full hover:bg-accent",
                                selectedEmployee?.id === emp.id && "bg-accent"
                            )}
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={emp.avatar} alt={`${emp.firstName} ${emp.lastName}`} />
                                <AvatarFallback>{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{emp.firstName} {emp.lastName}</p>
                                <Link 
                                    href={`https://t.me/${emp.telegramUsername}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-blue-500 hover:underline"
                                >
                                    @{emp.telegramUsername}
                                </Link>
                                <p className="text-xs text-muted-foreground mt-1">{employeePositions.join(', ')}</p>
                            </div>
                        </button>
                    )})}
                </div>
                <footer className="p-4 border-t">
                    <Button className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Запросити співробітника
                    </Button>
                </footer>
            </div>

            {/* Employee Details Panel */}
             <div className={cn(
                "flex-shrink-0 bg-card transition-all duration-300 ease-in-out overflow-y-auto w-full md:w-2/3 lg:w-3/4",
                 selectedEmployee ? "block" : "hidden md:block"
            )}>
                {selectedEmployee ? (
                    <EmployeeDetails employee={selectedEmployee} onUpdate={handleEmployeeUpdate} />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Оберіть співробітника для перегляду деталей</p>
                    </div>
                )}
            </div>
        </div>
    );
}


function EmployeeDetails({ employee, onUpdate }: { employee: Employee; onUpdate: (employee: Employee) => void; }) {
    const [isEditing, setIsEditing] = useState(false);
    
    const employeePositions = employee.positions.map(pId => mockPositions.find(p => p.id === pId)?.name).filter(Boolean);
    const employeeGroups = employee.groups.map(gId => mockGroups.find(g => g.id === gId)?.name).filter(Boolean);

    return (
        <div className="p-4 md:p-6 space-y-4">
            <header className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                     <Avatar className="h-16 w-16">
                        <AvatarImage src={employee.avatar} alt={`${employee.firstName} ${employee.lastName}`} />
                        <AvatarFallback className="text-xl">{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg font-bold font-headline">{employee.firstName} {employee.lastName}</h2>
                        <p className="text-sm text-muted-foreground">{employeePositions.join(', ')}</p>
                        <Badge variant={employee.status === 'active' ? 'secondary' : 'outline'} className="mt-2 capitalize text-xs">{employee.status}</Badge>
                    </div>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>Редагувати</DropdownMenuItem>
                        <DropdownMenuItem>Призначити задачу</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Видалити з компанії</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            
            <div className="grid md:grid-cols-2 gap-4">
                <InfoCard title="Контактна інформація">
                    <InfoRow label="Telegram" value={`@${employee.telegramUsername}`} isLink href={`https://t.me/${employee.telegramUsername}`} />
                </InfoCard>

                 <InfoCard title="Нотатки">
                    <p className="text-xs text-muted-foreground">{employee.notes || 'Немає нотаток.'}</p>
                </InfoCard>
            </div>

            <InfoCard title="Посади та групи">
                <InfoRow label="Посади" items={employeePositions} />
                <InfoRow label="Групи" items={employeeGroups} />
            </InfoCard>

             <InfoCard title="Синоніми">
                <div className="flex flex-wrap gap-2">
                    {employee.synonyms.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                    {employee.synonyms.length === 0 && <p className="text-xs text-muted-foreground">Немає синонімів.</p>}
                </div>
            </InfoCard>


            {/* Edit Employee Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Редагувати дані</DialogTitle>
                        <DialogDescription>
                            Оновіть інформацію для {employee.firstName} {employee.lastName}.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="edit-employee-form" onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const updatedEmployee: Employee = {
                            ...employee,
                            firstName: formData.get('firstName') as string,
                            lastName: formData.get('lastName') as string,
                            status: formData.get('status') as 'active' | 'vacation' | 'inactive',
                            notes: formData.get('notes') as string,
                        };
                        onUpdate(updatedEmployee);
                        setIsEditing(false);
                    }}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-xs">Ім'я</Label>
                                    <Input id="firstName" name="firstName" defaultValue={employee.firstName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-xs">Прізвище</Label>
                                    <Input id="lastName" name="lastName" defaultValue={employee.lastName} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-xs">Статус</Label>
                                <Select name="status" defaultValue={employee.status}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Обрати статус" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Активний</SelectItem>
                                        <SelectItem value="vacation">У відпустці</SelectItem>
                                        <SelectItem value="inactive">Неактивний</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-xs">Нотатки</Label>
                                <Textarea id="notes" name="notes" defaultValue={employee.notes} />
                            </div>
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Скасувати</Button>
                        <Button type="submit" form="edit-employee-form">Зберегти</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
         <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 text-xs">
                {children}
            </CardContent>
        </Card>
    )
}

function InfoRow({ label, value, items, isLink, href }: { label: string; value?: string, items?: string[], isLink?: boolean, href?: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {value && (
                 isLink ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">{value}</a>
                 ) : (
                    <p className="text-xs">{value}</p>
                 )
            )}
            {items && (
                 <div className="flex flex-wrap gap-1 mt-1">
                    {items.map((item, i) => <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>)}
                    {items.length === 0 && <p className="text-xs text-muted-foreground/80">Не призначено.</p>}
                </div>
            )}
        </div>
    )
}

    