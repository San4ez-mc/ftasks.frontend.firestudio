
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const results = [
    { id: '1', name: 'Конверсія з сайту', value: '12%' },
    { id: '2', name: 'Залучено нових клієнтів', value: '84' },
    { id: '3', name: 'Середній час відповіді', value: '2.5 год' },
];

export default function ResultsList() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Результати</CardTitle>
                <CardDescription>Клікніть щоб створити задачу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {results.map(result => (
                    <div key={result.id} className="p-3 rounded-md border hover:bg-accent cursor-pointer">
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">{result.value}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
