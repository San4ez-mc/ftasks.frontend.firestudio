
'use client';

import { useState, useRef, useEffect }d from 'react';
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
    isUrgent: true,
    deadline: '2024-09-01',
    assignee: { id: 'user-3', name: 'Олена Ковальчук', avatar: 'https://picsum.photos/40/40?random=3' },
    reporter: { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
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
    assignee: { id: 'user-1', name: 'Іван Петренко', avatar: 'https://picsum.photos/40/40?random=1' },
    reporter: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
    description: 'Інтегрувати нові дашборди для відстеження KPI в реальному часі.',
    subResults: [],
    tasks: [],
    templates: []
  },
  {
    id: 'res-3',
    name: 'Підготувати квартальний звіт для інвесторів',
    status: 'Заплановано',
    completed: false,
    deadline: '2024-09-30',
    assignee: { id: 'user-2', name: 'Марія Сидоренко', avatar: 'https://picsum.photos/40/40?random=2' },
    reporter: { id: 'user-4', name: 'Петро Іваненко', avatar: 'https://picsum.photos/40/40?random=4' },
    description: 'Звіт має містити аналіз фінансових показників, досягнень та планів на наступний квартал.',
    subResults: [],
    tasks: [],
    templates: []
  },
];

// Assume current user for filtering
const currentUserId = 'user-4';


export default function ResultsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [results, setResults] = useState(initialResults);
  const [activeTab, setActiveTab] = useState('mine');
  const newResultInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResultUpdate = (updatedResult: Result) => {
    setResults(currentResults =>
      currentResults.map(r => (r.id === updatedResult.id ? updatedResult : r))
    );
    if (selectedResult && selectedResult.id === updatedResult.id) {
      setSelectedResult(updatedResult);
    }
  };

  const createNewTask = (title: string, index?: number): Task => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'todo',
      type: 'important-not-urgent',
      expectedTime: 30,
      expectedResult: 'Очікуваний результат генерується GPT',
      assignee: { id: currentUserId, name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40' },
      reporter: { id: currentUserId, name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40?random=5' },
    };
    // This is a simplified placeholder. In a real app, you would add this to your tasks state.
    console.log("New task created:", newTask);
    return newTask;
  };

  const handleCreateNewResult = (index?: number) => {
    const newResult: Result = {
      id: `new-${Date.now()}`,
      name: '',
      status: 'Заплановано',
      completed: false,
      deadline: new Date().toISOString().split('T')[0],
      assignee: { id: currentUserId, name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40' },
      reporter: { id: currentUserId, name: 'Поточний користувач', avatar: 'https://picsum.photos/40/40' },
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
    setSelectedResult(newResult);
  };

  useEffect(() => {
    if (selectedResult?.id.startsWith('new-') && newResultInputRef.current) {
      newResultInputRef.current.focus();
    }
  }, [selectedResult]);

  const handleClosePanel = () => {
    setResults(prev => prev.filter(r => !(r.id.startsWith('new-') && r.name.trim() === '')));
    setSelectedResult(null);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            handleClosePanel();
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getFilteredResults = () => {
    switch(activeTab) {
        case 'delegated':
            return results.filter(r => r.reporter.id === currentUserId && r.assignee.id !== currentUserId);
        case 'subordinates':
            // This is a placeholder logic. A real app would have a manager-subordinate relationship.
            // Here, we'll just show results not assigned to or reported by the current user.
            return results.filter(r => r.reporter.id !== currentUserId && r.assignee.id !== currentUserId);
        case 'mine':
        default:
            return results.filter(r => r.assignee.id === currentUserId);
    }
  };
  
  const filteredResults = getFilteredResults();

  const groupedResults = activeTab === 'mine' 
    ? { [currentUserId]: filteredResults } 
    : filteredResults.reduce((acc, result) => {
        const key = result.assignee.id;
        if (!acc[key]) {
            acc[key] = { ...result.assignee, results: [] };
        }
        acc[key].results.push(result);
        return acc;
      }, {} as Record<string, { id: string; name: string; avatar?: string; results: Result[] }>);

  return (
    <div ref={containerRef} className="flex h-screen overflow-hidden">
      <div className={cn(
        "flex flex-col transition-all duration-300 w-full",
        selectedResult ? "md:w-1/2" : "w-full"
      )}>
        <header className="p-4 md:p-6">
          <div className="flex items-center justify-center relative mb-4">
            <h1 className="text-xl font-bold tracking-tight font-headline text-center">Результати</h1>
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              groupedResults={groupedResults}
              onResultSelect={setSelectedResult} 
              onResultUpdate={handleResultUpdate}
              createNewResult={handleCreateNewResult}
              selectedResultId={selectedResult?.id}
              newResultInputRef={newResultInputRef}
              activeTab={activeTab}
              panelOpen={!!selectedResult}
            />
          ) : (
            <ResultsCards results={filteredResults.filter(r => !r.id.startsWith('new-'))} onResultSelect={setSelectedResult} onResultUpdate={handleResultUpdate} />
          )}
        </main>
      </div>

      <div className={cn(
        "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden",
        selectedResult ? "w-full md:w-1/2 lg:min-w-[520px]" : "w-0"
      )}>
        {selectedResult && <ResultDetailsPanel key={selectedResult.id} result={selectedResult} onUpdate={handleResultUpdate} onClose={handleClosePanel} />}
      </div>
       <Button onClick={() => handleCreateNewResult()} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
          <Plus className="h-8 w-8" />
          <span className="sr-only">Створити результат</span>
        </Button>
    </div>
  );
}

type GroupedResults = Record<string, { id: string; name: string; avatar?: string; results: Result[] }>;

type ResultsTableProps = {
  groupedResults: GroupedResults;
  onResultSelect: (result: Result | null) => void;
  onResultUpdate: (result: Result) => void;
  createNewResult: (index?: number) => void;
  selectedResultId?: string;
  newResultInputRef: React.RefObject<HTMLInputElement>;
  activeTab: string;
  panelOpen: boolean;
};


function ResultsTable({
  groupedResults,
  onResultSelect,
  onResultUpdate,
  createNewResult,
  selectedResultId,
  newResultInputRef,
  activeTab,
  panelOpen,
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

  const handleAddSubResult = (result: Result) => {
    const newSubResult: SubResult = {
        id: `sub-${Date.now()}`,
        name: '',
        completed: false,
    };
    const updatedSubResults = [...result.subResults, newSubResult];
    onResultUpdate({ ...result, subResults: updatedSubResults });
  };

  const renderRow = (result: Result, index: number) => {
    const isCreating = result.id.startsWith('new-');

    if (isCreating) {
      return (
        <div key={`creating-${result.id}`} className="relative group p-2 bg-muted/50 text-sm">
          <div className="flex items-center gap-2">
            <Checkbox disabled />
            <Input
              ref={newResultInputRef}
              placeholder="Назва нового результату..."
              value={result.name}
              onChange={(e) => handleNewResultUpdate(result, e.target.value)}
              onBlur={() => onResultUpdate(result)}
              onKeyDown={(e) => { if(e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              className="border-none focus-visible:ring-0 shadow-none h-auto p-0 text-sm bg-transparent"
            />
          </div>
        </div>
      );
    }
    
    return (
      <div key={result.id} className="group/parent text-sm border-b last:border-b-0">
        <div className="relative group/row">
            <button
            onClick={() => createNewResult(index)}
            className="absolute z-10 -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex"
            >
                <Plus className="h-4 w-4" />
            </button>
            <div className={cn(
                "grid grid-cols-12 p-2 items-center gap-x-2 md:gap-x-4",
                selectedResultId === result.id && "bg-accent"
                )}>
                <div className="col-span-1 flex justify-center">
                    <Checkbox
                    checked={result.completed}
                    onCheckedChange={(checked) => onResultUpdate({ ...result, completed: !!checked })}
                    />
                </div>
                <div className="col-span-11 md:col-span-5 font-medium flex items-center gap-2">
                    <span
                    onClick={() => onResultSelect(result)}
                    className={cn("cursor-pointer flex-1", result.completed && "line-through text-muted-foreground")}
                    >
                    {result.name || <span className="text-muted-foreground">Без назви</span>}
                    </span>
                </div>
                <div className={cn("col-span-4 md:col-span-2 text-xs text-muted-foreground cursor-pointer transition-all duration-300", panelOpen && "hidden xl:block")} onClick={() => onResultSelect(result)}>
                    <p className="uppercase text-muted-foreground/70 text-[10px]">Дедлайн</p>
                    {formatDate(result.deadline)}
                </div>
                <div className={cn("col-span-4 md:col-span-3 flex items-center gap-2 cursor-pointer transition-all duration-300", panelOpen && "hidden lg:flex")} onClick={() => onResultSelect(result)}>
                    <div>
                        <p className="uppercase text-muted-foreground/70 text-[10px]">{activeTab === 'mine' ? 'Постановник' : 'Відповідальний'}</p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={activeTab === 'mine' ? result.reporter.avatar : result.assignee.avatar} alt={activeTab === 'mine' ? result.reporter.name : result.assignee.name} />
                                <AvatarFallback>{(activeTab === 'mine' ? result.reporter.name : result.assignee.name).charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs hidden lg:inline">{activeTab === 'mine' ? result.reporter.name : result.assignee.name}</span>
                        </div>
                    </div>
                </div>
                <div className="col-span-4 md:col-span-2 flex items-center cursor-pointer">
                    <div>
                        <p className="uppercase text-muted-foreground/70 text-[10px]">Статус</p>
                        <Badge variant={result.completed ? 'secondary' : 'outline'} className="text-xs" onClick={() => onResultSelect(result)}>
                            {result.completed ? 'Виконано' : result.status}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
        {(result.subResults.length > 0 || selectedResultId === result.id) && (
            <div className="pl-8 md:pl-12 py-1 pr-2 space-y-1">
                 {result.subResults.map((sr) => (
                    <div key={sr.id} className="flex items-center gap-2 text-xs group/sub-result">
                        <Checkbox 
                            checked={sr.completed}
                            onCheckedChange={(checked) => handleSubResultChange(result, sr.id, 'completed', !!checked)}
                        />
                        <Input 
                            value={sr.name}
                            onChange={(e) => handleSubResultChange(result, sr.id, 'name', e.target.value)}
                            placeholder="Підрезультат..."
                            className={cn(
                                "h-auto p-0 border-none focus-visible:ring-0 shadow-none text-xs bg-transparent",
                                sr.completed && "line-through text-muted-foreground"
                            )}
                        />
                         <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/sub-result:opacity-100" onClick={() => onResultUpdate({...result, subResults: result.subResults.filter(s => s.id !== sr.id)})}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                 ))}
                 <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => handleAddSubResult(result)}>
                    <Plus className="mr-1 h-3 w-3"/> Додати підрезультат
                 </Button>
            </div>
        )}
      </div>
    );
  };
    return (
        <div className="text-sm">
             {Object.values(groupedResults).map(group => (
                <div key={group.id} className="mb-6">
                    {activeTab !== 'mine' && (
                        <div className="flex items-center gap-3 p-2 border-b">
                            <Avatar>
                                <AvatarImage src={group.avatar} />
                                <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-base">{group.name}</h3>
                        </div>
                    )}
                    <div className="border rounded-lg">
                        {group.results.map(renderRow)}
                    </div>
                </div>
             ))}
             <div className="p-2">
                  <button onClick={() => createNewResult()} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-2 p-1">
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

    
