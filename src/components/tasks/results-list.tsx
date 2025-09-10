
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useTransition } from "react";
import { getResults } from "@/app/(app)/results/actions";
import type { Result } from "@/types/result";


type ResultsListProps = {
    onResultClick: (result: Result) => void;
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

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Результати</CardTitle>
                <CardDescription>Клікніть щоб створити задачу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
                {isPending && <p className="text-sm text-muted-foreground">Завантаження...</p>}
                {!isPending && results.length > 0 ? results.map(result => (
                    <div 
                        key={result.id} 
                        onClick={() => onResultClick(result)}
                        className="p-2 rounded-md border hover:bg-accent cursor-pointer"
                    >
                        <p className="font-medium text-xs">{result.name}</p>
                    </div>
                )) : (
                     !isPending && <p className="text-sm text-muted-foreground text-center p-4">Результати не очікуються</p>
                )}
            </CardContent>
        </Card>
    )
}
