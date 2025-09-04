
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Plus, FilePlus, Clock, MoreVertical, Paperclip, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const initialResults = [
  {
    id: 'res-1',
    name: 'Запустити рекламну кампанію в Google Ads',
    status: 'В роботі',
    deadline: '2024-09-01',
    assignee: { name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
    reporter: { name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
    description: 'Основна мета - залучити 1000 нових користувачів через пошукову рекламу. Бюджет 500$.',
    subResults: [
        { id: 'sub-1', name: 'Налаштувати аналітику', completed: true },
        { id: 'sub-2', name: 'Створити креативи', completed: false },
    ],
    tasks: [
        { id: 'task-5', name: 'Зібрати семантичне ядро', status: 'done' },
    ]
  },
  {
    id: 'res-2',
    name: 'Розробити новий модуль аналітики',
    status: 'Заплановано',
    deadline: '2024-10-15',
    assignee: { name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
    reporter: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
    description: 'Інтегрувати нові дашборди для відстеження KPI в реальному часі.',
    subResults: [],
    tasks: []
  },
];

type Result = (typeof initialResults)[0];

export default function ResultsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 md:p-6">
        <div className="flex items-center justify-center relative mb-4">
          <h1 className="text-3xl font-bold tracking-tight font-headline text-center">Результати</h1>
          <div className="absolute right-0 flex items-center gap-2">
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')}>
              <List className="h-5 w-5" />
            </Button>
            <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('cards')}>
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
            <Tabs defaultValue="mine">
                <TabsList>
                    <TabsTrigger value="mine">Мої</TabsTrigger>
                    <TabsTrigger value="delegated">Делеговані</TabsTrigger>
                    <TabsTrigger value="subordinates">Підлеглих</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto px-4 md:px-6">
        {viewMode === 'table' ? (
          <ResultsTable results={initialResults} onResultSelect={setSelectedResult} />
        ) : (
          <ResultsCards results={initialResults} onResultSelect={setSelectedResult} />
        )}
      </main>

      <Sheet open={!!selectedResult} onOpenChange={(isOpen) => !isOpen && setSelectedResult(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
          {selectedResult && <ResultDetailsPanel result={selectedResult} />}
        </SheetContent>
      </Sheet>

       <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
        <Plus className="h-8 w-8" />
        <span className="sr-only">Створити результат</span>
      </Button>
    </div>
  );
}

function ResultsTable({ results, onResultSelect }: { results: Result[], onResultSelect: (result: Result) => void }) {
    return (
        <div className="border rounded-lg">
             <div className="grid grid-cols-12 p-2 bg-muted text-muted-foreground font-medium text-sm">
                <div className="col-span-6">Назва</div>
                <div className="col-span-2">Дедлайн</div>
                <div className="col-span-2">Відповідальний</div>
                <div className="col-span-2">Статус</div>
            </div>
            {results.map(result => (
                <div key={result.id} onClick={() => onResultSelect(result)} className="grid grid-cols-12 p-2 border-t cursor-pointer hover:bg-accent">
                    <div className="col-span-6 font-medium">{result.name}</div>
                    <div className="col-span-2 text-sm text-muted-foreground">{result.deadline}</div>
                    <div className="col-span-2 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={result.assignee.avatar} alt={result.assignee.name} />
                            <AvatarFallback>{result.assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm hidden lg:inline">{result.assignee.name}</span>
                    </div>
                    <div className="col-span-2">
                        <Badge variant="outline">{result.status}</Badge>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ResultsCards({ results, onResultSelect }: { results: Result[], onResultSelect: (result: Result) => void }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map(result => (
                <Card key={result.id} onClick={() => onResultSelect(result)} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle>{result.name}</CardTitle>
                        <CardDescription>Дедлайн: {result.deadline}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={result.assignee.avatar} alt={result.assignee.name} />
                                    <AvatarFallback>{result.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{result.assignee.name}</span>
                            </div>
                            <Badge>{result.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function ResultDetailsPanel({ result }: { result: Result }) {
    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b">
                <div className="flex items-start gap-3">
                    <Checkbox id={`res-check-${result.id}`} className="mt-1" />
                    <h2 className="text-xl font-semibold flex-1">{result.name}</h2>
                    <Button variant="ghost" size="icon"><FilePlus className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Clock className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </div>
            </header>
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {/* Details Section */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground mb-1">Відповідальний</p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6"><AvatarImage src={result.assignee.avatar} /></Avatar>
                            <span>{result.assignee.name}</span>
                        </div>
                    </div>
                     <div>
                        <p className="text-muted-foreground mb-1">Постановник</p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6"><AvatarImage src={result.reporter.avatar} /></Avatar>
                            <span>{result.reporter.name}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Дедлайн</p>
                        <p>{result.deadline}</p>
                    </div>
                     <div>
                        <p className="text-muted-foreground mb-1">Статус</p>
                        <Badge>{result.status}</Badge>
                    </div>
                </div>
                <div>
                    <Label htmlFor="description">Опис</Label>
                    <Textarea id="description" defaultValue={result.description} readOnly className="mt-1 bg-transparent border-dashed"/>
                </div>

                <Separator />

                {/* Sub-results */}
                <div>
                    <h3 className="font-semibold mb-2">Підрезультати</h3>
                    <div className="space-y-2">
                        {result.subResults.map(sub => (
                             <div key={sub.id} className="flex items-center gap-2 p-1 rounded hover:bg-accent">
                                <Checkbox id={`sub-${sub.id}`} checked={sub.completed}/>
                                <label htmlFor={`sub-${sub.id}`} className="flex-1 text-sm">{sub.name}</label>
                            </div>
                        ))}
                        <Input placeholder="+ Додати підрезультат" className="border-dashed"/>
                    </div>
                </div>

                {/* Tasks */}
                <div>
                    <h3 className="font-semibold mb-2">Задачі</h3>
                    <div className="space-y-2">
                         {result.tasks.map(task => (
                             <div key={task.id} className="flex items-center gap-2 p-1 rounded text-sm border">
                               <p className="flex-1">{task.name}</p>
                               <Badge variant={task.status === 'done' ? 'secondary' : 'default'}>
                                   {task.status === 'done' ? 'Виконано' : 'В роботі'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Comments */}
                 <div>
                    <h3 className="font-semibold mb-2">Коментарі</h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src={result.reporter.avatar} /></Avatar>
                            <div>
                                <p className="font-medium text-sm">{result.reporter.name} <span className="text-xs text-muted-foreground ml-2">2 години тому</span></p>
                                <p className="text-sm bg-muted p-2 rounded-md mt-1">Не забудьте перевірити бюджети перед запуском.</p>
                            </div>
                        </div>
                    </div>
                 </div>

            </div>
            <footer className="p-4 border-t bg-background">
                <div className="relative">
                    <Textarea placeholder="Додати коментар..." className="pr-20"/>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
                        <Button size="icon"><Send className="h-4 w-4" /></Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}


    