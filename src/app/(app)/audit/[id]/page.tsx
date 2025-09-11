
'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mic, Square, Wand2, AlertTriangle, Send } from 'lucide-react';
import { continueConversationalAudit, getAudit, updateAudit } from '../actions';
import { useToast } from '@/hooks/use-toast';
import type { Audit, ConversationTurn } from '@/types/audit';
import type { AuditStructure } from '@/ai/types';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';


type AuditPageProps = {
  params: { id: string };
};

export default function AuditPage({ params }: AuditPageProps) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement>(null);


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
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = handleRecordingStop;

        mediaRecorder.start();
        setIsRecording(true);
        timerIntervalRef.current = setInterval(() => {
            setRecordingSeconds(prev => prev + 1);
        }, 1000);

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
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
    }
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

  const handleSubmit = (audioDataUri: string, textInput?: string) => {
    if ((!audioDataUri && !textInput) || !audit) return;
    
    setIsLoading(true);
    setCurrentTranscript('');

    startTransition(async () => {
      try {
        const result = await continueConversationalAudit({
          auditId: audit.id,
          userAudioDataUri: audioDataUri, // The new flow expects audio
          conversationHistory: audit.conversationHistory,
          currentSummary: audit.structuredSummary,
        });

        if (result.userTranscript) {
          setCurrentTranscript(result.userTranscript);
        }
        
        const updatedAudit = await updateAudit(audit.id, {
          structuredSummary: result.updatedStructuredSummary,
          conversationHistory: result.updatedConversationHistory,
        });

        if (updatedAudit) {
          setAudit(updatedAudit);
        }

      } catch (error) {
        console.error("Error in audit turn:", error);
        toast({ title: "Помилка AI", description: "Не вдалося обробити вашу відповідь.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    });
  };

  if (isPending || !audit) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }
  
  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Panel: Conversation */}
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
           {isLoading && (
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
          <Textarea placeholder="Або введіть відповідь текстом..." className="flex-1" disabled={isRecording || isLoading}/>
          <Button size="icon" className="h-12 w-12 shrink-0" onClick={isRecording ? stopRecording : startRecording} disabled={isLoading}>
            {isRecording ? <Square className="h-6 w-6"/> : <Mic className="h-6 w-6" />}
          </Button>
          {isRecording && <span className="text-sm font-mono min-w-[50px] text-center">{recordingSeconds}s</span>}
        </div>
      </div>

      {/* Right Panel: Structured Summary */}
      <aside className="w-full md:w-1/3 lg:w-2/5 bg-card border-l p-6 flex flex-col">
        <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2">
                <Wand2/>
                Структурована дешифровка
            </CardTitle>
            <CardDescription>Результати оновлюються після кожної вашої відповіді.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0 mt-6 space-y-4 overflow-y-auto">
           <StructuredSummaryView summary={audit.structuredSummary} />
        </CardContent>
      </aside>
    </div>
  );
}


function StructuredSummaryView({ summary }: { summary: AuditStructure }) {
    if (!summary || Object.keys(summary).length === 0) {
        return <p className="text-sm text-muted-foreground">Резюме буде сформовано після вашої першої відповіді.</p>;
    }

    const renderValue = (value: any, indent = 0) => {
        if (typeof value === 'string' || typeof value === 'number') {
            return <span className="text-muted-foreground">{value}</span>;
        }
        if (typeof value === 'boolean') {
            return <span className={value ? "text-green-500" : "text-red-500"}>{value ? 'Так' : 'Ні'}</span>;
        }
        if (Array.isArray(value)) {
            return (
                <ul className="list-disc pl-5 space-y-1">
                    {value.map((item, index) => <li key={index}>{renderValue(item, indent + 1)}</li>)}
                </ul>
            );
        }
        if (typeof value === 'object' && value !== null) {
            return (
                <div className="space-y-2 pl-4">
                    {Object.entries(value).map(([key, val]) => (
                        val !== undefined && val !== null && (!Array.isArray(val) || val.length > 0) && (
                             <div key={key}>
                                <h4 className="font-semibold text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                                {renderValue(val, indent + 1)}
                            </div>
                        )
                    ))}
                </div>
            );
        }
        return null;
    };
    
    return <div className="text-sm space-y-4">{renderValue(summary)}</div>;
}
