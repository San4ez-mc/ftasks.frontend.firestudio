
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo, useState, useTransition } from "react";
import { getResults } from "@/app/(app)/results/actions";
import type { Result, SubResult } from "@/types/result";
import { Check, ChevronsRight, CornerDownRight } from "lucide-react";


type ResultsListProps = {
    onResultClick: (result: {name: string, parentName: string}) => void;
};

type DisplayItem = {
    id: string;
    name: string;
    reporterName: string;
    parentName: string;
    isSubResult: boolean;
};

export default function ResultsList({ onResultClick }: ResultsListProps) {
    const [results, setResults] = useState<Result[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const fetchedResults = await getResults();
            setResults(fetchedResults);
        });
    }, []);

    const displayItems = useMemo(() => {
        const items: DisplayItem[] = [];
        const activeResults = results.filter(r => r.status !== 'Виконано' && r.status !== 'Відкладено');
        
        for (const result of activeResults) {
            const uncompletedSubResults = result.subResults.filter(sr => !sr.completed);
            if (uncompletedSubResults.length > 0) {
                for (const subResult of uncompletedSubResults) {
                    items.push({
                        id: subResult.id,
                        name: subResult.name,
                        reporterName: result.reporter.name,
                        parentName: result.name,
                        isSubResult: true,
                    });
                }
            } else {
                 items.push({
                    id: result.id,
                    name: result.name,
                    reporterName: result.reporter.name,
                    parentName: result.name,
                    isSubResult: false,
                });
            }
        }
        return items;

    }, [results]);

    const handleItemClick = (item: DisplayItem) => {
        onResultClick({name: item.name, parentName: item.parentName});
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Результати</CardTitle>
                <CardDescription>Клікніть щоб створити задачу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 flex-1 overflow-y-auto">
                {isPending && <p className="text-sm text-muted-foreground">Завантаження...</p>}
                {!isPending && displayItems.length > 0 ? displayItems.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => handleItemClick(item)}
                        className="p-2 rounded-md border hover:bg-accent cursor-pointer"
                    >
                        {item.isSubResult && (
                             <p className="text-xs text-muted-foreground truncate">{item.parentName}</p>
                        )}
                        <div className="flex items-start gap-2">
                             {item.isSubResult && <CornerDownRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/>}
                             <p className="font-medium text-xs flex-1">{item.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 pl-6">Постановник: {item.reporterName}</p>
                    </div>
                )) : (
                     !isPending && <p className="text-sm text-muted-foreground text-center p-4">Активних результатів немає.</p>
                )}
            </CardContent>
        </Card>
    )
}
