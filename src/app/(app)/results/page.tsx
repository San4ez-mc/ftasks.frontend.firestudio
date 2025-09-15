
'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Plus, FilePlus, Edit, Trash2, X, FileText, Clock, ArrowUpDown, Filter, User, Calendar, PlusCircle, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ResultDetailsPanel from '@/components/results/result-details-panel';
import type { Result, SubResult } from '@/types/result';
import { cn, formatDate } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import InteractiveTour from '@/components/layout/interactive-tour';
import type { TourStep } from '@/components/layout/interactive-tour';
import { getResults, createResult, updateResult, deleteResult } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { companyEmployees } from '@/lib/db';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const currentUser = companyEmployees.find(e => e.id === 'emp-2'); 
const allStatuses = ['В роботі', 'Заплановано', 'Виконано', 'Відкладено'];


// --- TOUR STEPS ---

const resultsTourSteps: TourStep[] = [
    {
        elementId: 'results-tabs',
        title: 'Фільтрація результатів',
        content: 'Використовуйте ці вкладки, щоб переглядати результати, за які ви відповідальні (Мої), які ви доручили іншим (Делеговані), результати ваших підлеглих, або відкладені.',
        placement: 'bottom'
    },
    {
        elementId: 'results-view-toggle',
        title: 'Режими перегляду',
        content: 'Перемикайтеся між режимом таблиці для детального огляду та режимом карток для візуального представлення.',
        placement: 'left'
    },
    {
        elementId: 'results-table',
        title: 'Список результатів',
        content: 'Це ваш основний робочий простір. Тут ви можете створювати нові результати, відзначати їх виконання та бачити ключову інформацію.',
        placement: 'bottom'
    },
     {
        elementId: 'result-details-panel',
        title: 'Панель деталей',
        content: 'Натисніть на будь-який результат, щоб відкрити цю панель. Тут можна редагувати опис, дедлайн, додавати підрезультати, задачі та коментарі.',
        placement: 'left'
    },
     {
        elementId: 'create-result-fab',
        title: 'Створити новий результат',
        content: 'Натисніть цю кнопку, щоб швидко додати новий результат до вашого списку.',
        placement: 'left'
    },
];


export default function ResultsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState('mine');
  const [statusFilter, setStatusFilter] = useState<string[]>(allStatuses);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [collapsedResults, setCollapsedResults] = useState<string[]>([]);

  useEffect(() => {
    const savedMode = localStorage.getItem('resultsViewMode');
    if (savedMode === 'table' || savedMode === 'cards') {
      setViewMode(savedMode as 'table' | 'cards');
    }
  }, []);

  const handleViewModeChange = (mode: 'table' | 'cards') => {
    localStorage.setItem('resultsViewMode', mode);
    setViewMode(mode);
  };

  useEffect(() => {
    startTransition(async () => {
        const fetchedResults = await getResults();
        setResults(fetchedResults);
    });
  }, []);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            const clickedOnTrigger = (event.target as HTMLElement).closest('.group/parent');
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

  const handleResultUpdate = (updatedResult: Result) => {
    startTransition(async () => {
        setResults(currentResults =>
          currentResults.map(r => (r.id === updatedResult.id ? updatedResult : r))
        );
        if (selectedResult && selectedResult.id === updatedResult.id) {
            setSelectedResult(updatedResult);
        }
        try {
            await updateResult(updatedResult.id, updatedResult);
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося оновити результат.", variant: "destructive" });
            const fetchedResults = await getResults(); // Re-fetch to sync
            setResults(fetchedResults);
        }
    });
  };

  const handleCreateNewResult = (index?: number) => {
    if (!currentUser) return;
    startTransition(async () => {
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

        const newResultData: Omit<Result, 'id' | 'companyId'> = {
            name: '',
            status: 'Заплановано',
            completed: false,
            isUrgent: false,
            deadline: twoWeeksFromNow.toISOString().split('T')[0],
            assignee: { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, avatar: currentUser.avatar },
            reporter: { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, avatar: currentUser.avatar },
            description: '',
            expectedResult: '',
            subResults: [],
            tasks: [],
            templates: [],
            comments: [],
            accessList: [],
        };
        try {
            const createdResult = await createResult(newResultData);
            setResults(prev => {
                const newResults = [...prev];
                const insertionIndex = index !== undefined ? index + 1 : prev.length;
                newResults.splice(insertionIndex, 0, createdResult);
                return newResults;
            });
            setSelectedResult(createdResult);
        } catch (error) {
            toast({ title: "Помилка", description: "Не вдалося створити результат.", variant: "destructive" });
        }
    });
  };
  
    const handleCreateTask = (result: Result) => {
        const newTask = {
            id: `task-${Date.now()}`,
            title: result.name,
            status: 'todo' as 'todo' | 'done'
        };
        handleResultUpdate({ ...result, tasks: [...result.tasks, newTask] });
        alert(`Задача "${result.name}" створена на сьогодні!`);
    }
    
     const handleCreateTemplate = (result: Result) => {
        const newTemplate = {
            id: `tpl-${Date.now()}`,
            name: result.name,
            repeatability: 'Щоденно',
        };
        handleResultUpdate({ ...result, templates: [...result.templates, newTemplate] });
    }

    const handleDeleteResult = (resultId: string) => {
        startTransition(async () => {
            const originalResults = results;
            setResults(prev => prev.filter(r => r.id !== resultId));
            if (selectedResult?.id === resultId) {
                setSelectedResult(null);
            }
            try {
                await deleteResult(resultId);
            } catch (error) {
                toast({ title: "Помилка", description: "Не вдалося видалити результат.", variant: "destructive" });
                setResults(originalResults); // Revert on error
            }
        });
    }

    const handlePostponeResult = (result: Result) => {
        handleResultUpdate({ ...result, status: 'Відкладено' });
    }

  const handleClosePanel = () => {
    const resultToClose = selectedResult;
    setSelectedResult(null);

    if (resultToClose && resultToClose.name.trim() === '') {
       handleDeleteResult(resultToClose.id);
    }
  };
  
  const toggleResultCollapse = (id: string) => {
    setCollapsedResults(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const filteredResults = useMemo(() => {
    if (!currentUser) return [];
    let filtered = results;
    
    // Primary tab filtering
    switch(activeTab) {
        case 'delegated':
            filtered = filtered.filter(r => r.reporter.id === currentUser.id && r.assignee.id !== currentUser.id && r.status !== 'Відкладено');
            break;
        case 'subordinates':
            filtered = filtered.filter(r => r.reporter.id !== currentUser.id && r.assignee.id !== currentUser.id && r.status !== 'Відкладено');
            break;
        case 'postponed':
            filtered = filtered.filter(r => r.status === 'Відкладено');
            break;
        case 'mine':
        default:
            filtered = filtered.filter(r => (r.assignee.id === currentUser.id || r.accessList?.some(user => user.id === currentUser.id)) && r.status !== 'Відкладено');
            break;
    }

    // Status filter
    if (activeTab !== 'postponed') {
       filtered = filtered.filter(r => statusFilter.includes(r.status));
    }
    
    return filtered;
  }, [results, activeTab, statusFilter, currentUser]);

  const groupedResults = activeTab === 'mine' && currentUser
    ? { [currentUser.id]: {id: currentUser.id, name: `${currentUser?.firstName} ${currentUser?.lastName}`, results: filteredResults } } 
    : filteredResults.reduce((acc, result) => {
        const key = result.assignee.id;
        if (!acc[key]) {
            acc[key] = { ...result.assignee, results: [] };
        }
        acc[key].results.push(result);
        return acc;
      }, {} as Record<string, { id: string; name: string; avatar?: string; results: Result[] }>);

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row h-screen overflow-hidden">
        <InteractiveTour pageKey="results" steps={resultsTourSteps} />
      <div className={cn(
        "flex flex-col transition-all duration-300 w-full",
        selectedResult ? "md:w-1/2" : "w-full"
      )}>
        <header className="p-4 md:p-6 space-y-4 border-b">
          <div className="flex items-center justify-center relative">
            <h1 className="text-xl font-bold tracking-tight font-headline text-center">Результати</h1>
            <div id="results-view-toggle" className="absolute right-0 flex items-center gap-2">
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewModeChange('table')}>
                <List className="h-5 w-5" />
              </Button>
              <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewModeChange('cards')}>
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <Tabs id="results-tabs" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                      <TabsTrigger value="mine">Мої та доступні мені</TabsTrigger>
                      <TabsTrigger value="delegated">Делеговані</TabsTrigger>
                      <TabsTrigger value="subordinates">Підлеглих</TabsTrigger>
                      <TabsTrigger value="postponed">Відкладені</TabsTrigger>
                  </TabsList>
              </Tabs>
              <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Статус
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                    <div className="space-y-2">
                        <Label className="font-semibold text-xs">Фільтрувати за статусом</Label>
                        <Separator />
                        {allStatuses.map(status => (
                            <div key={status} className="flex items-center gap-2">
                                <Checkbox 
                                    id={`status-${status}`}
                                    checked={statusFilter.includes(status)}
                                    onCheckedChange={(checked) => {
                                        setStatusFilter(prev => 
                                            checked ? [...prev, status] : prev.filter(s => s !== status)
                                        )
                                    }}
                                />
                                <Label htmlFor={`status-${status}`} className="text-xs font-normal">{status}</Label>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
              </Popover>
          </div>
        </header>
        
        <main id="results-table" className="flex-1 overflow-y-auto px-4 md:px-6">
          {isPending && viewMode === 'table' ? (
            <div className="flex justify-center items-center h-full"><p>Завантаження...</p></div>
          ) : viewMode === 'table' ? (
            <ResultsTable 
              groupedResults={groupedResults}
              onResultSelect={setSelectedResult} 
              onResultUpdate={handleResultUpdate}
              createNewResult={handleCreateNewResult}
              selectedResultId={selectedResult?.id}
              activeTab={activeTab}
              panelOpen={!!selectedResult}
              handleCreateTask={handleCreateTask}
              handleCreateTemplate={handleCreateTemplate}
              handleDeleteResult={handleDeleteResult}
              handlePostponeResult={handlePostponeResult}
              collapsedResults={collapsedResults}
              toggleCollapse={toggleResultCollapse}
            />
          ) : (
            <ResultsCards results={filteredResults} onResultSelect={setSelectedResult} onResultUpdate={handleResultUpdate} />
          )}
        </main>
      </div>

      <div id="result-details-panel" className={cn(
        "flex-shrink-0 bg-card border-l transition-all duration-300 ease-in-out overflow-hidden w-full md:w-0",
        selectedResult ? "md:w-1/2 lg:min-w-[520px]" : "hidden"
      )}>
        {selectedResult && <ResultDetailsPanel key={selectedResult.id} result={selectedResult} onUpdate={handleResultUpdate} onClose={handleClosePanel} onDelete={handleDeleteResult} />}
      </div>
       <Button id="create-result-fab" onClick={() => handleCreateNewResult()} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-20">
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
  activeTab: string;
  panelOpen: boolean;
  handleCreateTask: (result: Result) => void;
  handleCreateTemplate: (result: Result) => void;
  handleDeleteResult: (resultId: string) => void;
  handlePostponeResult: (result: Result) => void;
  collapsedResults: string[];
  toggleCollapse: (id: string) => void;
};


function ResultsTable({
  groupedResults,
  onResultSelect,
  onResultUpdate,
  createNewResult,
  selectedResultId,
  activeTab,
  panelOpen,
  handleCreateTask,
  handleCreateTemplate,
  handleDeleteResult,
  handlePostponeResult,
  collapsedResults,
  toggleCollapse
}: ResultsTableProps) {
  
  
  const handleSubResultChange = (result: Result, subResultPath: string[], field: 'name' | 'completed' | 'assignee' | 'deadline', value: any) => {
    
    const updateRecursively = (subResults: SubResult[], path: string[]): SubResult[] => {
      if (!path.length) return subResults;
      
      const [currentId, ...restPath] = path;

      return subResults.map(sr => {
        if (sr.id === currentId) {
          if (restPath.length === 0) {
            return { ...sr, [field]: value };
          }
          return { ...sr, subResults: updateRecursively(sr.subResults || [], restPath) };
        }
        return sr;
      });
    };

    const updatedSubResults = updateRecursively(result.subResults, subResultPath);
    onResultUpdate({ ...result, subResults: updatedSubResults });
  };

  const handleAddSubResult = (result: Result, parentSubResultPath: string[]) => {
    const newSubResult: SubResult = {
        id: `sub-${Date.now()}`,
        name: '',
        completed: false,
    };
    
    const addRecursively = (subResults: SubResult[], path: string[]): SubResult[] => {
       if (!path.length) {
            return [...(subResults || []), newSubResult];
       }
       const [currentId, ...restPath] = path;
       return subResults.map(sr => {
           if(sr.id === currentId) {
               return {...sr, subResults: addRecursively(sr.subResults || [], restPath)}
           }
           return sr;
       });
    }

    const updatedSubResults = addRecursively(result.subResults, parentSubResultPath);
    onResultUpdate({ ...result, subResults: updatedSubResults });
  };
  
  const handleDeleteSubResult = (result: Result, pathToDelete: string[]) => {
    const deleteRecursively = (items: SubResult[], path: string[]): SubResult[] => {
        const idToDelete = path[0];
        const remainingPath = path.slice(1);

        if (remainingPath.length === 0) {
            return items.filter(item => item.id !== idToDelete);
        }

        return items.map(item => {
            if (item.id === idToDelete && item.subResults) {
                return { ...item, subResults: deleteRecursively(item.subResults, remainingPath) };
            }
            return item;
        });
    };
    onResultUpdate({ ...result, subResults: deleteRecursively(result.subResults, pathToDelete) });
  };


  const renderRow = (result: Result, index: number, allResults: Result[]) => {
    const globalIndex = allResults.findIndex(r => r.id === result.id);
    
    return (
      <React.Fragment key={result.id}>
        <ResultRow 
          result={result}
          onResultSelect={onResultSelect}
          onResultUpdate={onResultUpdate}
          createNewResult={() => createNewResult(globalIndex)}
          selectedResultId={selectedResultId}
          activeTab={activeTab}
          panelOpen={panelOpen}
          onAddSubResult={handleAddSubResult}
          handleCreateTask={handleCreateTask}
          handleCreateTemplate={handleCreateTemplate}
          handleDeleteResult={handleDeleteResult}
          handlePostponeResult={handlePostponeResult}
          collapsedResults={collapsedResults}
          toggleCollapse={toggleCollapse}
        />
        {!collapsedResults.includes(result.id) && (result.subResults || []).map((sr) => (
          <SubResultRows 
            key={sr.id}
            result={result}
            subResult={sr}
            onResultSelect={() => onResultSelect(result)}
            onResultUpdate={onResultUpdate}
            onSubResultChange={handleSubResultChange}
            onAddSubResult={handleAddSubResult}
            onDeleteSubResult={handleDeleteSubResult}
            level={1}
            path={[sr.id]}
            panelOpen={panelOpen}
            collapsedResults={collapsedResults}
            toggleCollapse={toggleCollapse}
            selectedResultId={selectedResultId}
          />
        ))}
      </React.Fragment>
    );
  };

  const allResults = Object.values(groupedResults).flatMap(g => g.results);
  
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
                  <div className="border-y">
                      {group.results.map((result, index) => renderRow(result, index, allResults))}
                       {group.results.length === 0 || !group.results.some(r => r.name === '') && (
                           <div className="p-2">
                              <button onClick={() => createNewResult(allResults.length - 1)} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-2 p-1">
                                  <Plus className="h-3 w-3" /> Створити результат
                              </button>
                          </div>
                       )}
                  </div>
              </div>
           ))}
            {Object.keys(groupedResults).length === 0 && (
               <div className="p-2">
                  <button onClick={() => createNewResult()} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-2 p-1">
                      <Plus className="h-3 w-3" /> Створити результат
                  </button>
              </div>
            )}
      </div>
  )
}

function SubResultRows({ result, subResult, onResultSelect, onResultUpdate, onSubResultChange, onAddSubResult, onDeleteSubResult, level, path, panelOpen, collapsedResults, toggleCollapse, selectedResultId }: {
  result: Result;
  subResult: SubResult;
  onResultSelect: (result: Result) => void;
  onResultUpdate: (result: Result) => void;
  onSubResultChange: (result: Result, path: string[], field: 'name' | 'completed' | 'assignee' | 'deadline', value: any) => void;
  onAddSubResult: (result: Result, path: string[]) => void;
  onDeleteSubResult: (result: Result, path: string[]) => void;
  level: number;
  path: string[];
  panelOpen: boolean;
  collapsedResults: string[];
  toggleCollapse: (id: string) => void;
  selectedResultId?: string;
}) {
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onSubResultChange(result, path, 'name', e.target.value);
  }

  const hasSubResults = subResult.subResults && subResult.subResults.length > 0;
  const isCollapsed = collapsedResults.includes(subResult.id);

  return (
    <React.Fragment>
      <div 
        className="group/parent text-sm border-b last:border-b-0 cursor-pointer" 
        onClick={() => onResultSelect(result)}
      >
         <div className={cn(
            "grid grid-cols-12 p-2 items-start gap-x-2 md:gap-x-4 relative",
            selectedResultId === result.id && "bg-accent"
          )}>
            
            <div className={cn("col-span-11 flex items-start", panelOpen ? "md:col-span-11" : "md:col-span-5" )} style={{ paddingLeft: `${level * 1.5}rem` }}>
                <div className="absolute top-0 h-full w-px bg-border" style={{ left: `${(level - 1) * 1.5 + 0.75}rem`}}></div>
                <div className="absolute top-1/2 -translate-y-1/2 h-px w-3 bg-border" style={{ left: `${(level - 1) * 1.5 + 0.75}rem`}}></div>
                <div className="flex items-center gap-2 flex-1">
                    {hasSubResults ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleCollapse(subResult.id); }}
                            className="p-0.5 rounded-sm hover:bg-accent -ml-1"
                        >
                            <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-90")} />
                        </button>
                    ) : <div className="w-5" />}
                    
                    <Checkbox
                      checked={subResult.completed}
                      onCheckedChange={(checked) => {
                          onSubResultChange(result, path, 'completed', !!checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span
                        className={cn(
                            "h-auto p-0 text-xs flex-1",
                            subResult.completed && "line-through text-muted-foreground"
                        )}
                    >
                      {subResult.name || <span className="text-muted-foreground">Новий підрезультат...</span>}
                    </span>
                </div>
            </div>

            <div className={cn("hidden text-xs text-muted-foreground items-start", panelOpen ? "md:hidden" : "md:col-span-2 md:flex")}>
                 {subResult.deadline && (
                    <div>
                        <p className="uppercase text-muted-foreground/70 text-[10px]">Дедлайн</p>
                        {formatDate(subResult.deadline)}
                    </div>
                 )}
            </div>
             <div className={cn("hidden items-center gap-2", panelOpen ? "md:hidden" : "md:col-span-2 md:flex")}>
                {subResult.assignee && (
                    <div>
                        <p className="uppercase text-muted-foreground/70 text-[10px]">Виконавець</p>
                        <div className="flex items-center gap-2">
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Avatar className="h-6 w-6"><AvatarImage src={subResult.assignee.avatar} /></Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{subResult.assignee.name}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                             <span className="text-xs hidden lg:inline">{subResult.assignee.name}</span>
                        </div>
                    </div>
                )}
            </div>
            <div className={cn("hidden items-center", panelOpen ? "md:hidden" : "md:col-span-2 md:flex justify-end")}>
                <div className="flex items-center opacity-0 group-hover/parent:opacity-100 transition-opacity">
                     {level < 5 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onAddSubResult(result, path)}} title="Додати підрезультат">
                            <PlusCircle className="h-3 w-3" />
                        </Button>
                     )}
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDeleteSubResult(result, path)}} title="Видалити">
                        <Trash2 className="h-3 w-3 text-destructive"/>
                    </Button>
                </div>
            </div>
        </div>
      </div>
      {!isCollapsed && (subResult.subResults || []).map(sr => (
        <SubResultRows 
          key={sr.id}
          result={result}
          subResult={sr}
          onResultSelect={onResultSelect}
          onResultUpdate={onResultUpdate}
          onSubResultChange={onSubResultChange}
          onAddSubResult={onAddSubResult}
          onDeleteSubResult={onDeleteSubResult}
          level={level + 1}
          path={[...path, sr.id]}
          panelOpen={panelOpen}
          collapsedResults={collapsedResults}
          toggleCollapse={toggleCollapse}
          selectedResultId={selectedResultId}
        />
      ))}
    </React.Fragment>
  )
}


function ResultRow({ result, onResultSelect, onResultUpdate, createNewResult, selectedResultId, activeTab, panelOpen, onAddSubResult, handleCreateTask, handleCreateTemplate, handleDeleteResult, handlePostponeResult, collapsedResults, toggleCollapse}: any) {
    const hasSubResults = result.subResults && result.subResults.length > 0;
    const isCollapsed = collapsedResults.includes(result.id);
    
    const handleNameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onResultSelect(result);
    }

    return (
      <div 
        className="group/parent text-sm border-b last:border-b-0 cursor-pointer"
        onClick={handleNameClick}
      >
        <div className="relative group/row">
            <button
            onClick={(e) => { e.stopPropagation(); createNewResult(); }}
            className="absolute z-10 -left-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hidden sm:flex"
            >
                <Plus className="h-4 w-4" />
            </button>
            <div className={cn(
                "grid grid-cols-12 p-2 items-start gap-x-2 md:gap-x-4",
                selectedResultId === result.id && "bg-accent"
                )}>
                <div className="col-span-1 flex justify-center pt-1">
                    <Checkbox
                        checked={result.completed}
                        onCheckedChange={(checked) => onResultUpdate({ ...result, completed: !!checked })}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                <div className={cn("col-span-11", panelOpen ? "md:col-span-11" : "md:col-span-5" )}>
                    <div className="font-medium flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-1">
                             {hasSubResults ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleCollapse(result.id); }}
                                    className="p-0.5 rounded-sm hover:bg-accent"
                                >
                                    <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-90")} />
                                </button>
                            ) : (
                                <div className="w-5 h-5" />
                            )}
                            <span
                                className={cn("text-sm", result.completed && "line-through text-muted-foreground")}
                            >
                                {result.name || <span className="text-muted-foreground">Новий результат...</span>}
                            </span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNameClick} title="Редагувати"><Edit className="h-3 w-3"/></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); onAddSubResult(result, [])}} title="Додати підрезультат"><PlusCircle className="h-3 w-3"/></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); handlePostponeResult(result)}} title="Відкласти"><Clock className="h-3 w-3"/></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); handleCreateTask(result)}} title="Створити задачу"><Plus className="h-3 w-3"/></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); handleCreateTemplate(result)}} title="Створити шаблон"><FileText className="h-3 w-3"/></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()} title="Видалити"><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Цю дію неможливо скасувати. Це назавжди видалить результат "{result.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteResult(result.id)}>Видалити</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
                <div className={cn("hidden text-xs text-muted-foreground items-start", panelOpen ? "md:hidden" : "md:col-span-2 md:flex")}>
                    <div>
                        <p className="uppercase text-muted-foreground/70 text-[10px]">Дедлайн</p>
                        {formatDate(result.deadline)}
                    </div>
                </div>
                <div className={cn("hidden items-center gap-2", panelOpen ? "md:hidden" : "md:col-span-2 md:flex")}>
                    <div>
                        <p className="uppercase text-muted-foreground/70 text-[10px]">{activeTab === 'mine' || activeTab === 'delegated' ? 'Виконавець' : 'Постановник'}</p>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={result.assignee.avatar} alt={result.assignee.name} />
                                <AvatarFallback>{result.assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs hidden lg:inline">{result.assignee.name}</span>
                        </div>
                    </div>
                </div>
                <div className={cn("hidden items-center", panelOpen ? "md:hidden" : "md:col-span-2 md:flex")}>
                    <div>
                        <p className="uppercase text-muted-foreground/70 text-[10px]">Статус</p>
                        <Badge variant={result.completed ? 'secondary' : (result.status === 'Відкладено' ? 'outline' : (result.status === 'В роботі' ? 'default' : 'secondary'))} className={cn("text-xs", {'bg-pink-600 text-white': result.status === 'В роботі'})}>
                            {result.completed ? 'Виконано' : result.status}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
}

function ResultsCards({ results, onResultSelect, onResultUpdate }: { results: Result[], onResultSelect: (result: Result | null) => void, onResultUpdate: (result: Result) => void }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm mt-4">
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
                            <label htmlFor={`card-check-${result.id}`} onClick={() => onResultSelect(result)} className={cn("cursor-pointer text-sm", result.completed && "line-through text-muted-foreground")}>{result.name || <span className="text-muted-foreground">Без назви</span>}</label>
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
                            <Badge variant={result.completed ? 'secondary' : (result.status === 'Відкладено' ? 'outline' : 'default')}>{result.completed ? 'Виконано' : result.status}</Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
