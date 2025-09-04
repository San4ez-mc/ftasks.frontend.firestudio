
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Plus, FilePlus, Edit, Trash2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ResultDetailsPanel from '@/components/results/result-details-panel';
import type { Result, SubResult } from '@/types/result';
import { cn, formatDate } from '@/lib/utils';


const initialResults: Result[] = [
  {
    id: 'res-1',
    name: 'Запустити рекламну кампанію в Google Ads',
    status: 'В роботі',
    completed: false,
    deadline: '2024-09-01',
    assignee: { name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
    reporter: { name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
    description: 'Основна мета - залучити 1000 нових користувачів через пошукову рекламу. Бюджет 500$.',
    subResults: [
        { id: 'sub-1', name: 'Налаштувати аналітику', completed: true },
        { id: 'sub-2', name: 'Створити креативи', completed: false },
    ],
    tasks: [
        { id: 'task-5', title: 'Зібрати семантичне ядро', status: 'done' },
    ],
    templates: [
        { id: 'tpl-1', name: 'Щотижневий звіт по кампанії' }
    ]
  },
  {
    id: 'res-2',
    name: 'Розробити новий модуль аналітики',
    status: 'Заплановано',
    completed: false,
    deadline: '2024-10-15',
    assignee: { name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
    reporter: { name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
    description: 'Інтегрувати нові дашборди для відстеження KPI в реальному часі.',
    subResults: [],
    tasks: [],
    templates: []
  },
];


export default function ResultsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [results, setResults] = useState(initialResults);
  const [isCreating, setIsCreating] = useState(false);
  const newResultInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && selectedResult && newResultInputRef.current) {
        newResultInputRef.current.focus();
    }
  }, [isCreating, selectedResult]);
  
  const handleResultUpdate = (updatedResult: Result) => {
    // If the updated result was the one being created, finalize it.
    if (isCreating && selectedResult?.id === updatedResult.id && updatedResult.name.trim() !== '') {
        setIsCreating(false);
    }

    setResults(currentResults =>
      currentResults.map(r => (r.id === updatedResult.id ? updatedResult : r))
    );
    if (selectedResult && selectedResult.id === updatedResult.id) {
      setSelectedResult(updatedResult);
    }
  };

  const handleSelectResult = (result: Result | null) => {
    if (isCreating) {
      finalizeNewResult();
    }
    setSelectedResult(result);
  }
  
  const finalizeNewResult = () => {
    if (!isCreating) return;
    
    // Remove the temporary result if it's empty
    setResults(prev => prev.filter(r => !(r.id.startsWith('new-') && r.name.trim() === '')));
    setIsCreating(false);
    setSelectedResult(null);
  }
  
  const createNewResult = (name = '', index?: number): Result => {
     // Finalize any result that is currently being created before starting a new one
    if (isCreating) {
        finalizeNewResult();
    }

    const newResult: Result = {
      id: `new-${Date.now()}`,
      name: name,
      status: 'Заплановано',
      completed: false,
      deadline: new Date().toISOString().split('T')[0],
      assignee: { name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40' },
      reporter: { name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40' },
      description: '',
      subResults: [],
      tasks: [],
      templates: [],
    };
    
    setResults(prev => {
        const newResults = [...prev];
        const insertionIndex = index !== undefined ? index + 1 : prev.length;
        newResults.splice(insertionIndex, 0, newResult);
        return newResults;
    });

    setIsCreating(true);
    setSelectedResult(newResult);
    return newResult;
  };
    
  const handleClosePanel = () => {
     if (isCreating) {
      finalizeNewResult();
    }
    setSelectedResult(null);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={cn(
        "flex flex-col transition-all duration-300 w-full",
        selectedResult ? "md:w-1/2" : "w-full"
      )}>
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
            <ResultsTable 
              results={results} 
              onResultSelect={handleSelectResult} 
              onResultUpdate={handleResultUpdate}
              createNewResult={createNewResult}
              selectedResultId={selectedResult?.id}
              newResultInputRef={newResultInputRef}
            />
          ) : (
            <ResultsCards results={results.filter(r => !r.id.startsWith('new-'))} onResultSelect={handleSelectResult} onResultUpdate={handleResultUpdate} />
          )}
        </main>
      </div>

      <div className={cn(
        "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden",
        selectedResult ? "w-full md:w-1/2 lg:min-w-[520px]" : "w-0"
      )}>
        {selectedResult && <ResultDetailsPanel key={selectedResult.id} result={selectedResult} onUpdate={handleResultUpdate} isCreating={isCreating} onClose={handleClosePanel} />}
      </div>
       <Button onClick={() => createNewResult('', results.length -1)} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
          <Plus className="h-8 w-8" />
          <span className="sr-only">Створити результат</span>
        </Button>
    </div>
  );
}

type ResultsTableProps = {
  results: Result[];
  onResultSelect: (result: Result | null) => void;
  onResultUpdate: (result: Result) => void;
  createNewResult: (name?: string, index?: number) => void;
  selectedResultId?: string;
  newResultInputRef: React.RefObject<HTMLInputElement>;
};


function ResultsTable({
  results,
  onResultSelect,
  onResultUpdate,
  createNewResult,
  selectedResultId,
  newResultInputRef,
}: ResultsTableProps) {
  
  const handleNewResultUpdate = (result: Result, name: string) => {
    onResultUpdate({ ...result, name });
  };
  
  const handleSubResultChange = (result: Result, subResultId: string, field: 'name' | 'completed', value: string | boolean) => {
    const updatedSubResults = result.subResults.map(sr => 
        sr.id === subResultId ? { ...sr, [field]: value } : sr
    );
    onResultUpdate({ ...result, subResults: updatedSubResults });
  };

  const renderRow = (result: Result, index: number) => {
    const isCreating = result.id.startsWith('new-');

    if (isCreating) {
      return (
        <div key={`creating-${result.id}`} className="relative group">
          <div className="grid grid-cols-12 p-2 border-b border-t items-center gap-2 bg-muted/50 text-sm">
            <div className="col-span-1 flex justify-center">
              <Checkbox disabled />
            </div>
            <div className="col-span-11 -ml-2">
              <Input
                ref={newResultInputRef}
                placeholder="Назва нового результату..."
                value={result.name}
                onChange={(e) => handleNewResultUpdate(result, e.target.value)}
                onBlur={() => onResultUpdate(result)} // Finalize on blur
                onKeyDown={(e) => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                className="border-none focus-visible:ring-0 shadow-none h-auto p-0 text-sm"
              />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div key={result.id} className="group/parent">
        <div className="relative group/row">
            <button
            onClick={() => createNewResult('', index)}
            className="absolute z-10 -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex"
            >
                <Plus className="h-4 w-4" />
            </button>
            <div className={cn(
                "grid grid-cols-12 p-2 border-t items-center",
                selectedResultId === result.id && "bg-accent"
                )}>
            <div className="col-span-1 flex justify-center">
                <Checkbox
                checked={result.completed}
                onCheckedChange={(checked) => onResultUpdate({ ...result, completed: !!checked })}
                />
            </div>
            <div className="col-span-4 font-medium flex items-center gap-2">
                <span
                onClick={() => onResultSelect(result)}
                className={cn("cursor-pointer flex-1", result.completed && "line-through text-muted-foreground")}
                >
                {result.name || <span className="text-muted-foreground">Без назви</span>}
                </span>
            </div>
            <div onClick={() => onResultSelect(result)} className="col-span-2 text-xs text-muted-foreground cursor-pointer">
                {formatDate(result.deadline)}
            </div>
            <div onClick={() => onResultSelect(result)} className="col-span-3 flex items-center gap-2 cursor-pointer">
                <Avatar className="h-6 w-6">
                <AvatarImage src={result.assignee.avatar} alt={result.assignee.name} />
                <AvatarFallback>{result.assignee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-xs hidden lg:inline">{result.assignee.name}</span>
            </div>
            <div className="col-span-2 flex justify-between items-center">
                <Badge variant={result.completed ? 'secondary' : 'outline'} className="cursor-pointer" onClick={() => onResultSelect(result)}>
                {result.completed ? 'Виконано' : result.status}
                </Badge>
                <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <FilePlus className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                </Button>
                </div>
            </div>
            </div>
        </div>
        {result.subResults.length > 0 && (
            <div className="pl-8 border-t">
                 {result.subResults.map((sr) => (
                    <div key={sr.id} className="grid grid-cols-12 p-2 items-center text-xs">
                        <div className="col-span-1 flex justify-center">
                            <Checkbox 
                                checked={sr.completed}
                                onCheckedChange={(checked) => handleSubResultChange(result, sr.id, 'completed', !!checked)}
                            />
                        </div>
                        <div className="col-span-11 -ml-2">
                             <Input 
                                value={sr.name}
                                onChange={(e) => handleSubResultChange(result, sr.id, 'name', e.target.value)}
                                placeholder="Підрезультат..."
                                className={cn(
                                    "h-auto p-0 border-none focus-visible:ring-0 shadow-none text-xs bg-transparent",
                                    sr.completed && "line-through text-muted-foreground"
                                )}
                            />
                        </div>
                    </div>
                 ))}
            </div>
        )}
      </div>
    );
  };
    return (
        <div className="border rounded-lg text-sm">
             <div className="grid grid-cols-12 p-2 bg-muted text-muted-foreground font-medium text-xs uppercase tracking-wider">
                <div className="col-span-5 col-start-2">Назва</div>
                <div className="col-span-2">Дедлайн</div>
                <div className="col-span-3">Відповідальний</div>
                <div className="col-span-2">Статус</div>
            </div>
            <div>
              {results.map(renderRow)}
            </div>
             <div className="p-2 border-t">
                  <button onClick={() => createNewResult('', results.length -1)} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-2 p-1">
                      <Plus className="h-3 w-3" /> Створити результат
                  </button>
              </div>
        </div>
    )
}

function ResultsCards({ results, onResultSelect, onResultUpdate }: { results: Result[], onResultSelect: (result: Result | null) => void, onResultUpdate: (result: Result) => void }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
            {results.map(result => (
                <Card key={result.id} className={cn("hover:shadow-lg transition-shadow", result.completed && "bg-muted/50")}>
                    <CardHeader>
                         <CardTitle className="flex items-start gap-2 text-base">
                           <Checkbox
                                id={`card-check-${result.id}`}
                                className="mt-1"
                                checked={result.completed}
                                onCheckedChange={(checked) => onResultUpdate({ ...result, completed: !!checked })}
                            />
                            <label htmlFor={`card-check-${result.id}`} onClick={() => onResultSelect(result)} className={cn("cursor-pointer", result.completed && "line-through text-muted-foreground")}>{result.name || <span className="text-muted-foreground">Без назви</span>}</label>
                         </CardTitle>
                        <CardDescription onClick={() => onResultSelect(result)} className="cursor-pointer">Дедлайн: {formatDate(result.deadline)}</CardDescription>
                    </CardHeader>
                    <CardContent onClick={() => onResultSelect(result)} className="cursor-pointer">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={result.assignee.avatar} alt={result.assignee.name} />
                                    <AvatarFallback>{result.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{result.assignee.name}</span>
                            </div>
                            <Badge variant={result.completed ? 'secondary' : 'default'}>{result.completed ? 'Виконано' : result.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

    