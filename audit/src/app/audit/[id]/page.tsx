
'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mic, Square, Wand2, AlertTriangle, Send, Sparkles, FileText, ArrowRight, ClipboardCopy, RefreshCcw } from 'lucide-react';
import { continueAudit, getAudit, finalizeAndSaveAudit, retryAiProcessing } from '../../actions';
import { useToast } from '@/hooks/use-toast';
import type { Audit, ConversationTurn, WorkPlanItem } from '@/types/audit';
import type { AuditStructure } from '@/ai/types';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


type AuditPageProps = {
  params: { id: string };
};

export default function AuditPage({ params }: AuditPageProps) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
      startTransition(async () => {
          const fetchedAudit = await getAudit(params.id);
          if (fetchedAudit) {
              setAudit(fetchedAudit);
          } else {
              toast({ title: "Помилка", description: "Аудит не знайдено.", variant: "destructive"});
              router.push('/audit');
          }
      });
  }, [params.id, router, toast]);

  const handleFinishAudit = () => {
    if (!audit || !audit.structuredSummary) return;
    startTransition(async () => {
        try {
            const updatedAudit = await finalizeAndSaveAudit(audit.id);
            if(updatedAudit) {
                setAudit(updatedAudit);
            }
             toast({ title: "Аудит завершено!", description: "План робіт та звіт успішно згенеровано та збережено." });
        } catch (error) {
            console.error("Error finishing audit:", error);
            toast({ title: "Помилка", description: "Не вдалося згенерувати та зберегти звіт.", variant: "destructive" });
        }
    });
  }

  if (!audit) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }
  
  if (audit.isCompleted) {
      return <CompletedAuditView audit={audit} />;
  }

  return <OngoingAuditView audit={audit} setAudit={setAudit} onFinish={handleFinishAudit} />;
}


function OngoingAuditView({ audit, setAudit, onFinish }: { audit: Audit, setAudit: (audit: Audit) => void, onFinish: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const conversationEndRef = useRef<HTMLDivElement>(null);
    const [aiError, setAiError] = useState(false);
    const [auditDuration, setAuditDuration] = useState('');
    const summaryContentRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const timer = setInterval(() => {
            const seconds = Math.floor((Date.now() - new Date(audit.createdAt).getTime()) / 1000);
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            setAuditDuration(`${h}:${m}:${s}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [audit.createdAt]);
    

     useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }, [audit?.conversationHistory]);

     useEffect(() => {
        summaryContentRef.current?.scrollTo({
            top: summaryContentRef.current.scrollHeight,
            behavior: 'smooth'
        });
     }, [audit?.structuredSummary]);


    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = handleRecordingStop;
            mediaRecorder.start();
            setIsRecording(true);
            timerIntervalRef.current = setInterval(() => setRecordingSeconds(prev => prev + 1), 1000);
        } catch (err) {
            console.error("Error starting recording:", err);
            toast({ title: "Помилка запису", description: "Не вдалося отримати доступ до мікрофону.", variant: "destructive"});
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setRecordingSeconds(0);
    };

    const handleRecordingStop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const audioDataUri = reader.result as string;
            handleSubmit(audioDataUri);
        };
    };

    const handleSubmit = (audioDataUri?: string, text?: string) => {
        if ((!audioDataUri && !text) || !audit) return;
        
        setCurrentTranscript('');
        if (text) setTextInput('');
        setAiError(false);

        startTransition(async () => {
            try {
                const result = await continueAudit({
                    auditId: audit.id,
                    userAudioDataUri: audioDataUri,
                    userText: text,
                });

                if (result.success) {
                    if (result.data.userTranscript) setCurrentTranscript(result.data.userTranscript);
                    
                    const updatedAudit = await getAudit(audit.id);
                    if (updatedAudit) setAudit(updatedAudit);
                } else {
                    toast({ title: "Помилка AI", description: "Вашу відповідь збережено, але ШІ не зміг її обробити. Спробуйте ще раз.", variant: "destructive" });
                    const fetchedAudit = await getAudit(audit.id);
                    if (fetchedAudit) setAudit(fetchedAudit);
                    setAiError(true);
                }

            } catch (error) {
                console.error("Error in audit turn:", error);
                toast({ title: "Критична помилка", description: "Не вдалося зберегти вашу відповідь.", variant: "destructive" });
            }
        });
    };
    
    const handleTextSubmit = () => {
        if (textInput.trim()) {
            handleSubmit(undefined, textInput.trim());
        }
    }
    
    const handleRetry = () => {
        setAiError(false);
        startTransition(async () => {
            const result = await retryAiProcessing(audit.id);
            if (result.success) {
                 const updatedAudit = await getAudit(audit.id);
                 if (updatedAudit) setAudit(updatedAudit);
            } else {
                toast({ title: "Помилка AI", description: "Спроба не вдалася. Спробуйте ще раз пізніше.", variant: "destructive" });
                setAiError(true);
            }
        });
    }

    return (
         <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
            <div className="flex flex-col flex-1 p-4 md:p-8 space-y-4">
                 <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-lg font-semibold">Діалог з AI-консультантом</h2>
                    <div className="font-mono text-lg">{auditDuration}</div>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto pr-4">
                {(audit.conversationHistory || []).map((turn, index) => (
                    <div key={index} className={cn("flex items-start gap-4", turn.role === 'user' && "justify-end")}>
                        {turn.role === 'model' && <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0"><Wand2 className="h-5 w-5"/></div>}
                        <div className={cn("p-3 rounded-lg max-w-lg", turn.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                            <p className="whitespace-pre-wrap">{turn.text}</p>
                        </div>
                    </div>
                ))}
                {isPending && !aiError && (
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0"><Wand2 className="h-5 w-5"/></div>
                        <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <span className="text-sm text-muted-foreground">{currentTranscript ? 'Аналізую...' : 'Обробка...'}</span>
                        </div>
                    </div>
                )}
                {aiError && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Помилка обробки</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>Вашу відповідь збережено.</span>
                            <Button variant="secondary" size="sm" onClick={handleRetry} disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                <span className="ml-2">Повторити</span>
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}
                <div ref={conversationEndRef} />
                </div>
                
                <div className="flex items-center gap-2 pt-4 border-t">
                    <Textarea 
                        placeholder="Або введіть відповідь текстом..." 
                        className="flex-1" 
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleTextSubmit();
                            }
                        }}
                        disabled={isRecording || isPending}
                    />
                    <Button size="icon" className="h-12 w-12 shrink-0" onClick={isRecording ? stopRecording : startRecording} disabled={isPending}>
                        {isRecording ? <Square className="h-6 w-6"/> : <Mic className="h-6 w-6" />}
                    </Button>
                     <Button size="icon" className="h-12 w-12 shrink-0" onClick={handleTextSubmit} disabled={isRecording || isPending || !textInput.trim()}>
                        <Send className="h-6 w-6"/>
                    </Button>
                    {isRecording && <span className="text-sm font-mono min-w-[50px] text-center">{recordingSeconds}s</span>}
                </div>
            </div>
            <aside className="w-full md:w-1/3 lg:w-2/5 bg-card border-l p-6 flex flex-col h-full">
                 <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-2">
                        <FileText />
                        Поточна ситуація
                    </CardTitle>
                    <CardDescription>Результати оновлюються після кожної вашої відповіді.</CardDescription>
                </CardHeader>
                <CardContent ref={summaryContentRef} className="flex-1 p-0 mt-6 space-y-4 overflow-y-auto">
                    <StructuredSummaryView summary={audit.structuredSummary} />
                </CardContent>
                 <div className="pt-4 border-t mt-4">
                    <Button onClick={onFinish} disabled={isPending || !audit.isAiComplete} className="w-full">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Завершити аудит та згенерувати план
                    </Button>
                </div>
            </aside>
        </div>
    );
}

function CompletedAuditView({ audit }: { audit: Audit }) {
  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto">
        <TeamAuditProposal audit={audit} />
        <Separator className="my-8" />
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="flex flex-col">
                <CardHeader className="px-0">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText />
                        Поточна ситуація (Результати аудиту)
                    </CardTitle>
                    <CardDescription>Зведений аналіз на основі вашого діалогу.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    <StructuredSummaryView summary={audit.structuredSummary} />
                </CardContent>
            </div>

            <div className="flex flex-col">
                <CardHeader className="px-0">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Sparkles />
                        План робіт після консалтингу
                    </CardTitle>
                    <CardDescription>Рекомендовані кроки для систематизації та покращення вашого бізнесу.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <WorkPlanView workPlan={audit.workPlan || []} />
                </CardContent>
            </div>
        </div>
    </div>
  );
}


function StructuredSummaryView({ summary }: { summary: AuditStructure }) {
    if (!summary || Object.keys(summary).length === 0) {
        return <p className="text-sm text-muted-foreground">Резюме буде сформовано після вашої першої відповіді.</p>;
    }

    const renderValue = (value: any): React.ReactNode => {
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            return <span className="text-muted-foreground">-</span>;
        }
        if (typeof value === 'string' || typeof value === 'number') {
            return <p className="text-muted-foreground whitespace-pre-wrap">{value}</p>;
        }
        if (typeof value === 'boolean') {
            return <Badge variant={value ? 'secondary' : 'outline'}>{value ? 'Так' : 'Ні'}</Badge>;
        }
        if (Array.isArray(value) && value.length === 0) {
             return <span className="text-muted-foreground">-</span>;
        }
        if (Array.isArray(value)) {
            return (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {value.map((item, index) => <li key={index}>{renderValue(item)}</li>)}
                </ul>
            );
        }
        if (typeof value === 'object') {
            const entries = Object.entries(value);
            if (entries.length === 0) {
                return <span className="text-muted-foreground">-</span>;
            }
            return (
                <div className="space-y-4 pl-4 border-l ml-2">
                    {entries.map(([key, val]) => {
                        const hasValue = val !== undefined && val !== null && val !== '';
                        return (
                             <div key={key}>
                                <h4 className="font-semibold capitalize text-xs tracking-wide">{key.replace(/([A-Z])/g, ' $1')}</h4>
                                {hasValue ? renderValue(val) : <span className="text-muted-foreground">-</span>}
                            </div>
                        )
                    })}
                </div>
            );
        }
        return null;
    };
    
    return <div className="text-sm space-y-6">{renderValue(summary)}</div>;
}

function WorkPlanView({ workPlan }: { workPlan: WorkPlanItem[] }) {
    if (!workPlan || workPlan.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>План робіт ще не згенеровано.</p>
                <p>Він з'явиться після завершення аудиту.</p>
            </div>
        );
    }

    const groupedByDepartment = workPlan.reduce((acc, item) => {
        const dept = item.department || "Загальне";
        if (!acc[dept]) {
            acc[dept] = [];
        }
        acc[dept].push(item);
        return acc;
    }, {} as Record<string, WorkPlanItem[]>);

    return (
        <div className="space-y-8">
            {Object.entries(groupedByDepartment).map(([department, items]) => (
                <Card key={department} className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">{department}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-background">
                                <h4 className="font-semibold text-destructive">Проблема (як є зараз)</h4>
                                <p className="text-muted-foreground text-sm mt-1">{item.problem}</p>
                                <h4 className="font-semibold text-primary mt-3">Рішення (як має бути)</h4>
                                <p className="text-sm mt-1">{item.solution}</p>
                                <Badge variant="outline" className="mt-3">
                                    Орієнтовний термін: {item.timelineMonths} міс.
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
             <div className="text-center pt-4">
                 <Button asChild>
                    <Link href="https://ring-asterisk-327.notion.site/246549e42c9a800d8f21f75d1ddb2e77?source=copy_link" target="_blank" rel="noopener noreferrer">
                        Отримати комерційну пропозицію <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </div>
        </div>
    )
}

function TeamAuditProposal({ audit }: { audit: Audit }) {
    const { toast } = useToast();
    const teamMembers = audit.structuredSummary?.team?.roles?.map(r => r.employeeName).filter(Boolean) || [];

    if (teamMembers.length === 0) {
        return null;
    }

    const handleCopyLink = (employeeName: string) => {
        const link = `${window.location.origin}/audit?employee=${encodeURIComponent(employeeName)}`;
        navigator.clipboard.writeText(link);
        toast({ title: "Посилання скопійовано!", description: `Надішліть його співробітнику ${employeeName}.` });
    };

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="text-xl">Наступний крок: Аудит команди</CardTitle>
                <CardDescription className="text-base">
                    Ви можете переглянути попередні результати аудиту нижче, але для повної та об'єктивної картини ми наполегливо рекомендуємо зібрати думки ключових співробітників.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="mb-4 text-sm">Надішліть їм персональні посилання для проходження короткого анонімного аудиту. Після того, як всі пройдуть опитування, ми надішлемо вам зведений звіт.</p>
                <ul className="space-y-2">
                    {teamMembers.map((name, index) => (
                        <li key={index} className="flex items-center justify-between p-3 border rounded-md bg-background">
                            <span className="font-medium text-sm">{name} <span className="text-xs text-muted-foreground ml-2">(статус: очікується)</span></span>
                            <Button size="sm" variant="secondary" onClick={() => handleCopyLink(name)}>
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                                Копіювати посилання
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

    