
'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mic, Square, Wand2, AlertTriangle, Send, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { continueAudit, getAudit, updateAudit, generateWorkPlan } from '../actions';
import { useToast } from '@/hooks/use-toast';
import type { Audit, ConversationTurn, WorkPlanItem } from '@/types/audit';
import type { AuditStructure } from '@/ai/types';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


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
    if (!audit) return;
    startTransition(async () => {
        try {
            const plan = await generateWorkPlan(audit.structuredSummary);
            const updatedAudit = await updateAudit(audit.id, {
                workPlan: plan,
                isCompleted: true,
            });
            if(updatedAudit) {
                setAudit(updatedAudit);
            }
             toast({ title: "Аудит завершено!", description: "План робіт успішно згенеровано." });
        } catch (error) {
            console.error("Error finishing audit:", error);
            toast({ title: "Помилка", description: "Не вдалося згенерувати план робіт.", variant: "destructive" });
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
    const conversationEndRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }, [audit?.conversationHistory]);

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

    const handleSubmit = (audioDataUri?: string, textInput?: string) => {
        if ((!audioDataUri && !textInput) || !audit) return;
        
        setCurrentTranscript('');

        startTransition(async () => {
            try {
                const result = await continueAudit({
                    auditId: audit.id,
                    userAudioDataUri: audioDataUri || '',
                    conversationHistory: audit.conversationHistory,
                    currentSummary: audit.structuredSummary,
                });

                if (result.userTranscript) setCurrentTranscript(result.userTranscript);
                
                const updatedAudit = await updateAudit(audit.id, {
                    structuredSummary: result.updatedStructuredSummary,
                    conversationHistory: result.updatedConversationHistory,
                });

                if (updatedAudit) setAudit(updatedAudit);

            } catch (error) {
                console.error("Error in audit turn:", error);
                toast({ title: "Помилка AI", description: "Не вдалося обробити вашу відповідь.", variant: "destructive" });
            }
        });
    };

    return (
         <div className="flex flex-col md:flex-row h-full">
            <div className="flex flex-col flex-1 p-4 md:p-8 space-y-4">
                <div className="flex-1 space-y-4 overflow-y-auto pr-4">
                {audit.conversationHistory.map((turn, index) => (
                    <div key={index} className={cn("flex items-start gap-4", turn.role === 'user' && "justify-end")}>
                        {turn.role === 'model' && <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0"><Wand2 className="h-5 w-5"/></div>}
                        <div className={cn("p-3 rounded-lg max-w-lg", turn.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                            <p className="whitespace-pre-wrap">{turn.text}</p>
                        </div>
                    </div>
                ))}
                {isPending && (
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0"><Wand2 className="h-5 w-5"/></div>
                        <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <span className="text-sm text-muted-foreground">{currentTranscript ? 'Аналізую...' : 'Транскрибую...'}</span>
                        </div>
                    </div>
                )}
                <div ref={conversationEndRef} />
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t">
                    <Textarea placeholder="Або введіть відповідь текстом..." className="flex-1" disabled={isRecording || isPending}/>
                    <Button size="icon" className="h-12 w-12 shrink-0" onClick={isRecording ? stopRecording : startRecording} disabled={isPending}>
                        {isRecording ? <Square className="h-6 w-6"/> : <Mic className="h-6 w-6" />}
                    </Button>
                    {isRecording && <span className="text-sm font-mono min-w-[50px] text-center">{recordingSeconds}s</span>}
                </div>
            </div>
            <aside className="w-full md:w-1/3 lg:w-2/5 bg-card border-l p-6 flex flex-col">
                 <CardHeader className="p-0">
                    <CardTitle className="flex items-center gap-2">
                        <FileText />
                        Поточна ситуація
                    </CardTitle>
                    <CardDescription>Результати оновлюються після кожної вашої відповіді.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 mt-6 space-y-4 overflow-y-auto">
                    <StructuredSummaryView summary={audit.structuredSummary} />
                </CardContent>
                 <div className="pt-4 border-t mt-4">
                    <Button onClick={onFinish} disabled={isPending} className="w-full">
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
    <div className="grid md:grid-cols-2 h-full">
      {/* Left Panel: Current Situation */}
      <div className="flex flex-col p-6 border-r overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText />
            Поточна ситуація (Результати аудиту)
          </CardTitle>
          <CardDescription>Зведений аналіз на основі вашого діалогу.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StructuredSummaryView summary={audit.structuredSummary} />
        </CardContent>
      </div>

      {/* Right Panel: Work Plan */}
      <div className="flex flex-col p-6 overflow-y-auto bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles />
            План робіт після консалтингу
          </CardTitle>
          <CardDescription>Рекомендовані кроки для систематизації та покращення вашого бізнесу.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkPlanView workPlan={audit.workPlan} />
        </CardContent>
      </div>
    </div>
  );
}


function StructuredSummaryView({ summary }: { summary: AuditStructure }) {
    if (!summary || Object.keys(summary).length === 0) {
        return <p className="text-sm text-muted-foreground">Резюме буде сформовано після вашої першої відповіді.</p>;
    }

    const renderValue = (value: any) => {
        if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;
        if (typeof value === 'string' && value.trim() === '') return <span className="text-muted-foreground">-</span>;
        if (typeof value === 'string' || typeof value === 'number') {
            return <p className="text-muted-foreground">{value}</p>;
        }
        if (typeof value === 'boolean') {
            return <Badge variant={value ? 'secondary' : 'outline'}>{value ? 'Так' : 'Ні'}</Badge>;
        }
        if (Array.isArray(value) && value.length === 0) return <span className="text-muted-foreground">-</span>;
        if (Array.isArray(value)) {
            return (
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {value.map((item, index) => <li key={index}>{renderValue(item)}</li>)}
                </ul>
            );
        }
        if (typeof value === 'object') {
            return (
                <div className="space-y-4 pl-4 border-l ml-2">
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key}>
                            <h4 className="font-semibold capitalize text-xs tracking-wide">{key.replace(/([A-Z])/g, ' $1')}</h4>
                            {renderValue(val)}
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };
    
    return <div className="text-sm space-y-6">{renderValue(summary)}</div>;
}

function WorkPlanView({ workPlan }: { workPlan: WorkPlanItem[] }) {
    return (
        <div className="space-y-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/2">Проблема (як є зараз)</TableHead>
                        <TableHead className="w-1/2">Рішення (як має бути)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {workPlan.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="align-top text-muted-foreground">{item.problem}</TableCell>
                            <TableCell className="align-top font-medium">{item.solution}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
