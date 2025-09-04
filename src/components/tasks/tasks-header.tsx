
'use client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TasksHeaderProps = {
    currentDate: Date;
    onDateChange: (date: Date) => void;
};

export default function TasksHeader({ currentDate, onDateChange }: TasksHeaderProps) {
    const changeDate = (days: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + days);
        onDateChange(newDate);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
                    <ChevronLeft />
                </Button>
                <h2 className="text-xl font-semibold text-center whitespace-nowrap">
                    Мої задачі на {currentDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
                    <ChevronRight />
                </Button>
            </div>
            <Tabs defaultValue="mine">
                <TabsList>
                    <TabsTrigger value="mine">Мої</TabsTrigger>
                    <TabsTrigger value="delegated">Делеговані</TabsTrigger>
                    <TabsTrigger value="subordinates">Підлеглих</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
}
