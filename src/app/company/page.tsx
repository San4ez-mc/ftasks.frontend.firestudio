
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Search, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// --- MOCK DATA ---

const mockPositions = [
    { id: 'pos-1', name: 'Frontend Developer' },
    { id: 'pos-2', name: 'Backend Developer' },
    { id: 'pos-3', name: 'Project Manager' },
    { id: 'pos-4', name: 'Marketing Manager' },
    { id: 'pos-5', name: 'UI/UX Designer' },
    { id: 'pos-6', 'name': 'CEO' },
    { id: 'pos-7', 'name': 'CTO' },
];

const mockGroups = [
    { id: 'grp-1', name: 'Основна команда розробки' },
    { id: 'grp-2', name: 'Менеджмент' },
    { id: 'grp-3', name: 'Маркетинг' },
];

const mockEmployeesData = [
    { 
        id: 'emp-1',
        telegramUserId: 'tg-123',
        telegramUsername: 'ivan_p',
        firstName: 'Іван',
        lastName: 'Петренко',
        avatar: 'https://picsum.photos/100/100?random=1',
        status: 'active',
        notes: 'Ключовий розробник, спеціалізується на React та Next.js. Відповідальний за архітектуру фронтенду.',
        positions: ['pos-1', 'pos-7'], // Multiple positions
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
        notes: 'Менеджер проектів, відповідає за комунікацію з клієнтами та планування спринтів.',
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
        notes: 'Сильний дизайнер з досвідом у мобільних додатках.',
        positions: ['pos-5'],
        groups: ['grp-1'],
        synonyms: [],
    },
    { 
        id: 'emp-4',
        telegramUserId: 'tg-101',
        telegramUsername: 'petro_i',
        firstName: 'Петро',
        lastName: 'Іваненко',
        avatar: 'https://picsum.photos/100/100?random=4',
        status: 'active',
        notes: 'Засновник та ідейний лідер компанії.',
        positions: ['pos-6'],
        groups: ['grp-2'],
        synonyms: ['Петя'],
    },
     { 
        id: 'emp-5',
        telegramUserId: 'tg-112',
        telegramUsername: 'andriy_b',
        firstName: 'Андрій',
        lastName: 'Бондаренко',
        avatar: 'https://picsum.photos/100/100?random=5',
        status: 'inactive',
        notes: 'Спеціаліст з контекстної реклами та SEO.',
        positions: ['pos-4'],
        groups: ['grp-3'],
        synonyms: [],
    },
];

type Employee = typeof mockEmployeesData[0];

// --- MAIN COMPONENT ---

export default function CompanyPage() {
    const [employees, setEmployees] = useState(mockEmployeesData);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    
    const handleEmployeeUpdate = (updatedEmployee: Employee) => {
        setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
        if (selectedEmployee?.id === updatedEmployee.id) {
            setSelectedEmployee(updatedEmployee);
        }
    };
    
    const handleClosePanel = () => {
        setSelectedEmployee(null);
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Employee List */}
            <div className={cn(
                "flex flex-col w-full transition-all duration-300",
                selectedEmployee ? "md:w-1/2" : "w-full"
            )}>
                <header className="p-4 border-b">
                    <div className="flex items-center justify-between">
                         <h1 className="text-xl font-bold tracking-tight font-headline">Співробітники</h1>
                         <Button>
                            <PlusCircle className="mr-2 h-4 w-4" /> Запросити
                        </Button>
                    </div>
                     <div className="relative mt-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Пошук співробітників..." className="pl-8" />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ім'я</TableHead>
                                <TableHead>Посада</TableHead>
                                <TableHead>Telegram</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map(emp => {
                                const employeePositions = emp.positions.map(pId => mockPositions.find(p => p.id === pId)?.name).filter(Boolean);
                                return (
                                    <TableRow 
                                        key={emp.id} 
                                        onClick={() => setSelectedEmployee(emp)}
                                        className={cn(
                                            "cursor-pointer",
                                            selectedEmployee?.id === emp.id && "bg-accent"
                                        )}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={emp.avatar} alt={emp.firstName} />
                                                    <AvatarFallback>{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                                                </Avatar>
                                                <span>{emp.firstName} {emp.lastName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {employeePositions.map(p => <div key={p}>{p}</div>)}
                                        </TableCell>
                                        <TableCell>
                                            <Link 
                                                href={`https://t.me/${emp.telegramUsername}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-xs text-blue-500 hover:underline"
                                            >
                                                @{emp.telegramUsername}
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Employee Details Panel */}
             <div className={cn(
                "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden",
                 selectedEmployee ? "w-full md:w-1/2" : "w-0"
            )}>
                {selectedEmployee && (
                    <EmployeeDetails 
                        key={selectedEmployee.id} // Re-mount component on selection change
                        employee={selectedEmployee} 
                        onUpdate={handleEmployeeUpdate}
                        onClose={handleClosePanel}
                    />
                )}
            </div>
        </div>
    );
}

// --- DETAILS PANEL COMPONENT ---

function EmployeeDetails({ employee, onUpdate, onClose }: { employee: Employee; onUpdate: (employee: Employee) => void; onClose: () => void; }) {
    
    // Local state for edits
    const [formData, setFormData] = useState<Partial<Employee>>(employee);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value: Employee['status']) => {
        setFormData(prev => ({ ...prev, status: value }));
    };

    const handlePositionChange = (positionId: string) => {
        setFormData(prev => {
            const currentPositions = prev.positions || [];
            const newPositions = currentPositions.includes(positionId)
                ? currentPositions.filter(p => p !== positionId)
                : [...currentPositions, positionId];
            return { ...prev, positions: newPositions };
        });
    };
    
    const handleSaveChanges = () => {
        onUpdate({ ...employee, ...formData });
        // Optional: show a toast notification
    };

    const employeePositions = formData.positions?.map(pId => mockPositions.find(p => p.id === pId)).filter(Boolean) || [];

    return (
        <div className="p-4 md:p-6 space-y-4 text-sm flex flex-col h-full">
            <header className="flex-shrink-0 flex items-start justify-between">
                <div className="flex items-center gap-3">
                     <div className="relative group">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={formData.avatar} alt={`${formData.firstName} ${formData.lastName}`} />
                            <AvatarFallback className="text-xl">{formData.firstName?.[0]}{formData.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                            <Upload className="h-6 w-6" />
                            <input id="avatar-upload" type="file" className="sr-only" />
                        </label>
                     </div>
                    <div>
                        <h2 className="text-lg font-bold font-headline">{formData.firstName} {formData.lastName}</h2>
                        <p className="text-xs text-muted-foreground">{employeePositions.map(p => p?.name).join(', ')}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleSaveChanges}>Зберегти</Button>
                    <Button variant="ghost" onClick={onClose}>Скасувати</Button>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto space-y-4">
                <Card>
                    <CardHeader className="p-4">
                         <CardTitle className="text-sm font-semibold">Основна інформація</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="firstName" className="text-xs">Ім'я</Label>
                            <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className="h-8 text-sm"/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="lastName" className="text-xs">Прізвище</Label>
                            <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="h-8 text-sm"/>
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="status" className="text-xs">Статус</Label>
                            <Select name="status" value={formData.status} onValueChange={handleStatusChange}>
                                <SelectTrigger id="status" className="h-8 text-sm">
                                    <SelectValue placeholder="Обрати статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Активний</SelectItem>
                                    <SelectItem value="vacation">У відпустці</SelectItem>
                                    <SelectItem value="inactive">Неактивний</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4">
                         <CardTitle className="text-sm font-semibold">Посади</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap gap-2">
                            {mockPositions.map(pos => (
                                <button
                                    key={pos.id}
                                    onClick={() => handlePositionChange(pos.id)}
                                    className={cn(
                                        "px-2 py-1 text-xs rounded-md border",
                                        formData.positions?.includes(pos.id) 
                                            ? "bg-primary text-primary-foreground border-transparent"
                                            : "bg-transparent hover:bg-accent"
                                    )}
                                >
                                    {pos.name}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-semibold">Нотатки</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                         <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} className="min-h-[80px] text-xs"/>
                    </CardContent>
                </Card>

                 <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Видалити з компанії
                </Button>
            </div>
        </div>
    )
}

    