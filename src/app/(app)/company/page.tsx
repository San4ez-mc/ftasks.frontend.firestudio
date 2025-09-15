
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Search, Trash2, Upload, Save, X, Shield, Bot, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';
import type { Employee } from '@/types/company';
import type { CompanyProfile } from '@/types/company-profile';
import { getEmployees, updateEmployee, getCompanyProfile, updateCompanyProfile, createEmployee } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';


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

const telegramCommands = [
    { id: 'create_task', label: 'Створювати задачі' },
    { id: 'create_result', label: 'Створювати результати' },
    { id: 'view_tasks', label: 'Переглядати задачі' },
    { id: 'list_employees', label: 'Переглядати співробітників' },
];


// --- TOUR STEPS ---

const companyTourSteps: TourStep[] = [
    {
        elementId: 'employee-list-table',
        title: 'Список співробітників',
        content: 'Тут ви бачите повний список всіх співробітників компанії. Ви можете шукати, сортувати та переглядати основну інформацію.',
        placement: 'right'
    },
    {
        elementId: 'invite-employee-button',
        title: 'Запрошення нових співробітників',
        content: 'Натисніть цю кнопку, щоб надіслати запрошення новому члену команди або додати його вручну.',
        placement: 'left'
    },
    {
        elementId: 'employee-details-panel',
        title: 'Панель деталей',
        content: 'Після вибору співробітника тут з\'являється детальна інформація: посади, контакти, нотатки. Ви можете редагувати ці дані.',
        placement: 'left'
    },
     {
        elementId: 'save-employee-button',
        title: 'Збереження змін',
        content: 'Не забувайте зберігати будь-які зміни, внесені в профіль співробітника, натиснувши цю кнопку.',
        placement: 'left'
    },
];


// --- MAIN COMPONENT ---

export default function CompanyPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);


    useEffect(() => {
        startTransition(async () => {
            const [fetchedEmployees, fetchedProfile] = await Promise.all([
                getEmployees(),
                getCompanyProfile()
            ]);
            setEmployees(fetchedEmployees);
            if (fetchedEmployees.length > 0 && !selectedEmployee) {
                setSelectedEmployee(fetchedEmployees[0]);
            }
            setCompanyProfile(fetchedProfile);
        });
    }, [selectedEmployee]);

     useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                const clickedOnTrigger = (event.target as HTMLElement).closest('[data-employee-row]');
                 if (!clickedOnTrigger) {
                    handleClosePanel();
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    const handleEmployeeUpdate = (updatedEmployee: Employee) => {
        startTransition(async () => {
            // Optimistic update
            setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
            if (selectedEmployee?.id === updatedEmployee.id) {
                setSelectedEmployee(updatedEmployee);
            }

            try {
                await updateEmployee(updatedEmployee.id, updatedEmployee);
                toast({ title: "Успіх", description: "Дані співробітника оновлено." });
            } catch (error) {
                toast({ title: "Помилка", description: "Не вдалося оновити дані.", variant: "destructive" });
                // Re-fetch to sync
                const fetchedEmployees = await getEmployees();
                setEmployees(fetchedEmployees);
            }
        });
    };
    
    const handleEmployeeCreate = (newEmployeeData: Omit<Employee, 'id' | 'status' | 'notes' | 'groups' | 'synonyms' | 'avatar' | 'telegramUserId'> & { positionId: string }) => {
        startTransition(async () => {
            try {
                const newEmployee = await createEmployee(newEmployeeData);
                setEmployees(prev => [newEmployee, ...prev]);
                setSelectedEmployee(newEmployee);
                setIsAddDialogOpen(false);
                toast({ title: "Успіх!", description: `Співробітника ${newEmployee.firstName} додано.` });
            } catch (error) {
                toast({ title: "Помилка", description: "Не вдалося створити співробітника.", variant: "destructive"});
            }
        });
    }

    const handleClosePanel = () => {
        setSelectedEmployee(null);
    }
    
    const handleCompanyInfoSave = () => {
        if (!companyProfile) return;
        startTransition(async () => {
            try {
                await updateCompanyProfile({
                    name: companyProfile.name,
                    description: companyProfile.description,
                    adminId: companyProfile.adminId,
                });
                toast({ title: "Успіх", description: "Інформацію про компанію оновлено." });
            } catch (error) {
                 toast({ title: "Помилка", description: "Не вдалося оновити інформацію про компанію.", variant: "destructive" });
            }
        });
    }

    return (
        <div ref={containerRef} className="flex flex-col md:flex-row h-screen overflow-hidden">
            <InteractiveTour pageKey="company" steps={companyTourSteps} />
            {/* Employee List */}
            <div className={cn(
                "flex flex-col w-full transition-all duration-300",
                selectedEmployee ? "md:w-1/2" : "w-full"
            )}>
                <header className="p-4 border-b">
                    <div className="flex items-center justify-between">
                         <h1 className="text-xl font-bold tracking-tight font-headline">Співробітники</h1>
                         <AddEmployeeDialog 
                            isOpen={isAddDialogOpen} 
                            setIsOpen={setIsAddDialogOpen}
                            onEmployeeCreate={handleEmployeeCreate}
                            isPending={isPending}
                        />
                    </div>
                     <div className="relative mt-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Пошук співробітників..." className="pl-8" />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto" id="employee-list-table">
                     {companyProfile && (
                        <Card className="m-4">
                            <CardHeader>
                                <CardTitle>Інформація про компанію</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="companyName">Назва компанії</Label>
                                    <Input 
                                        id="companyName" 
                                        value={companyProfile.name} 
                                        onChange={(e) => setCompanyProfile({...companyProfile, name: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="companyDescription">Опис</Label>
                                    <Textarea 
                                        id="companyDescription" 
                                        value={companyProfile.description} 
                                        onChange={(e) => setCompanyProfile({...companyProfile, description: e.target.value})} 
                                    />
                                </div>
                                 <div>
                                    <Label htmlFor="companyAdmin" className="flex items-center gap-2"><Shield className="h-4 w-4"/> Адміністратор системи</Label>
                                    <Select 
                                        value={companyProfile.adminId} 
                                        onValueChange={(adminId) => setCompanyProfile({...companyProfile, adminId: adminId})}
                                    >
                                        <SelectTrigger id="companyAdmin">
                                            <SelectValue placeholder="Обрати адміністратора..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                 </div>
                                <Button size="sm" onClick={handleCompanyInfoSave} disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    Зберегти
                                </Button>
                            </CardContent>
                        </Card>
                     )}
                    {isPending && !employees.length ? <p className="p-4">Завантаження...</p> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ім'я</TableHead>
                                <TableHead className="hidden sm:table-cell">Посада</TableHead>
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
                                        data-employee-row
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
                                        <TableCell className="text-xs hidden sm:table-cell">
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
                    )}
                </div>
            </div>

            {/* Employee Details Panel */}
             <div id="employee-details-panel" className={cn(
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


function AddEmployeeDialog({ isOpen, setIsOpen, onEmployeeCreate, isPending }: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onEmployeeCreate: (data: any) => void;
    isPending: boolean;
}) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            positionId: formData.get('positionId') as string,
            telegramUsername: formData.get('telegramUsername') as string,
        };
        onEmployeeCreate(data);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button id="invite-employee-button">
                    <PlusCircle className="mr-2 h-4 w-4" /> Додати співробітника
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Додати нового співробітника</DialogTitle>
                    <DialogDescription>Створіть профіль для нового члена команди. Він зможе увійти пізніше через Telegram.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">Ім'я</Label>
                                <Input id="firstName" name="firstName" required />
                            </div>
                             <div>
                                <Label htmlFor="lastName">Прізвище</Label>
                                <Input id="lastName" name="lastName" required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="positionId">Посада</Label>
                            <Select name="positionId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Оберіть посаду..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockPositions.map(pos => (
                                        <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="telegramUsername">Нік в Telegram</Label>
                            <Input id="telegramUsername" name="telegramUsername" placeholder="bez_sobaky" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Скасувати</Button>
                        <Button type="submit" disabled={isPending}>
                             {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Додати
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- DETAILS PANEL COMPONENT ---

function EmployeeDetails({ employee, onUpdate, onClose }: { employee: Employee; onUpdate: (employee: Employee) => void; onClose: () => void; }) {

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
    
    const handlePermissionChange = (commandId: string, checked: boolean) => {
        setFormData(prev => {
            const currentPermissions = prev.telegramPermissions || [];
            const newPermissions = checked
                ? [...currentPermissions, commandId]
                : currentPermissions.filter(id => id !== commandId);
            return { ...prev, telegramPermissions: newPermissions };
        });
    };

    const handleSaveChanges = () => {
        onUpdate({ ...employee, ...formData });
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
                    <Button id="save-employee-button" onClick={handleSaveChanges}>Зберегти</Button>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
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
                            <Label htmlFor="email" className="text-xs">Пошта</Label>
                            <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} className="h-8 text-sm"/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="birthDate" className="text-xs">День народження</Label>
                            <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate || ''} onChange={handleInputChange} className="h-8 text-sm"/>
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
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            Дозволи для Telegram-бота
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                        {telegramCommands.map(command => (
                            <div key={command.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`perm-${command.id}`}
                                    checked={formData.telegramPermissions?.includes(command.id)}
                                    onCheckedChange={(checked) => handlePermissionChange(command.id, !!checked)}
                                />
                                <Label htmlFor={`perm-${command.id}`} className="text-xs font-normal">
                                    {command.label}
                                </Label>
                            </div>
                        ))}
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
