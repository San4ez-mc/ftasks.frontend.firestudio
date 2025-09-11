
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useTransition } from "react";
import { getResults } from "@/app/(app)/results/actions";
import type { Result } from "@/types/result";
import { Check, ChevronsRight } from "lucide-react";


type ResultsListProps = {
    onResultClick: (result: Result) => void;
};

export default function ResultsList({ onResultClick }: ResultsListProps) {
    const [results, setResults] = useState<Result[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const fetchedResults = await getResults();
            // Фільтруємо виконані та відкладені результати
            setResults(fetchedResults.filter(r => r.status !== 'Виконано' && r.status !== 'Відкладено'));
        });
    }, []);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Результати</CardTitle>
                <CardDescription>Клікніть щоб створити задачу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 flex-1 overflow-y-auto">
                {isPending && <p className="text-sm text-muted-foreground">Завантаження...</p>}
                {!isPending && results.length > 0 ? results.map(result => (
                    <div 
                        key={result.id} 
                        onClick={() => onResultClick(result)}
                        className="p-2 rounded-md border hover:bg-accent cursor-pointer"
                    >
                        <p className="font-medium text-xs">{result.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Постановник: {result.reporter.name}</p>
                        {result.subResults && result.subResults.length > 0 && (
                            <div className="mt-2 space-y-1 pl-2 border-l ml-1">
                                {result.subResults.filter(sr => !sr.completed).map(sr => (
                                     <div key={sr.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <ChevronsRight className="h-3 w-3 shrink-0"/>
                                        <span>{sr.name}</span>
                                     </div>
                                ))}
                            </div>
                        )}
                    </div>
                )) : (
                     !isPending && <p className="text-sm text-muted-foreground text-center p-4">Активних результатів немає.</p>
                )}
            </CardContent>
        </Card>
    )
}
