
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
import type { Result } from '@/types/result';
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
    completed: true,
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
    setResults(results.map(r => r.id === updatedResult.id ? updatedResult : r));
    if (selectedResult && selectedResult.id === updatedResult.id) {
      setSelectedResult(updatedResult);
    }
  };

  const handleSelectResult = (result: Result | null) => {
    if (isCreating && selectedResult && selectedResult.name.trim() === '') {
        setResults(prev => prev.filter(r => r.id !== selectedResult.id));
    }
    setIsCreating(false);
    setSelectedResult(result);
  }

  const finalizeNewResult = () => {
    if (isCreating && selectedResult) {
       if (selectedResult.name.trim() === '') {
        setResults(prev => prev.filter(r => r.id !== selectedResult.id));
        setSelectedResult(null);
      }
    }
    setIsCreating(false);
  }
  
  const createNewResult = (name = '', index?: number) => {
    finalizeNewResult();
    
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
      templates: []
    };
    
    const insertionIndex = index !== undefined ? index + 1 : results.length;
    const newResults = [...results];
    newResults.splice(insertionIndex, 0, newResult);
    setResults(newResults);
    
    setSelectedResult(newResult);
    setIsCreating(true);
  }

  const handleAddNewClick = () => {
    createNewResult('', results.length - 1);
  }
  
  const handleAddInBetween = (index: number) => {
    createNewResult('', index);
  };


  const handleNewResultNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if(selectedResult && isCreating){
      const updatedResult = {...selectedResult, name};
      setSelectedResult(updatedResult);
      handleResultUpdate(updatedResult);
    }
  }

  const handleNewResultKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
      finalizeNewResult();
      e.currentTarget.blur();
    }
  }
  
  const handleBlur = () => {
    finalizeNewResult();
  }
  
  const handleClosePanel = () => {
    handleSelectResult(null);
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
              onAddNewInBetween={handleAddInBetween}
              isCreating={isCreating}
              selectedResult={selectedResult}
              onNewResultNameChange={handleNewResultNameChange}
              onNewResultKeyDown={handleNewResultKeyDown}
              onBlur={handleBlur}
              newResultInputRef={newResultInputRef}
            />
          ) : (
            <ResultsCards results={results.filter(r => !isCreating || r.id !== selectedResult?.id)} onResultSelect={(r) => handleSelectResult(r)} onResultUpdate={handleResultUpdate} />
          )}
        </main>
      </div>

      <div className={cn(
        "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden",
        selectedResult ? "w-full md:w-1/2 lg:min-w-[520px]" : "w-0"
      )}>
        {selectedResult && <ResultDetailsPanel key={selectedResult.id} result={selectedResult} onUpdate={handleResultUpdate} isCreating={isCreating} onClose={handleClosePanel} />}
      </div>
       <Button onClick={handleAddNewClick} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
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
  onAddNewInBetween: (index: number) => void;
  isCreating: boolean;
  selectedResult: Result | null;
  onNewResultNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewResultKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  newResultInputRef: React.RefObject<HTMLInputElement>;
};


function ResultsTable({
  results,
  onResultSelect,
  onResultUpdate,
  onAddNewInBetween,
  isCreating,
  selectedResult,
  onNewResultNameChange,
  onNewResultKeyDown,
  onBlur,
  newResultInputRef
}: ResultsTableProps) {

  const renderRow = (result: Result, index: number) => {
    // This condition checks if the current row is the one being created.
    if (isCreating && selectedResult?.id === result.id) {
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
                value={selectedResult?.name || ''}
                onChange={onNewResultNameChange}
                onKeyDown={onNewResultKeyDown}
                onBlur={onBlur}
                className="border-none focus-visible:ring-0 shadow-none h-auto p-0 text-sm"
              />
            </div>
          </div>
          {/* Always show the plus button for the next row, even for the new input */}
          <button
            onClick={() => onAddNewInBetween(index)}
            className="absolute z-10 -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
            >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div key={result.id} className="relative group">
        <button
          onClick={() => onAddNewInBetween(index)}
          className="absolute z-10 -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className={cn(
            "grid grid-cols-12 p-2 border-t items-center",
            selectedResult?.id === result.id && "bg-accent"
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
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
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
            {results.map(renderRow)}
             <div className="p-2 border-t">
                  <button onClick={() => onAddNewInBetween(results.length -1)} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-2 p-1">
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

    

    