
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const initialQuestions = [
  { id: 1, text: 'Яка головна ціль вашої компанії на найближчий рік?' },
  { id: 2, text: 'Опишіть вашого ідеального клієнта. Хто він?' },
  { id: 3, text: 'Яка найбільша перешкода, що заважає вам досягти цілей швидше?' },
  { id: 4, text: 'Які процеси у вашій компанії ви вважаєте найбільш хаотичними або неефективними?' },
  { id: 5, text: 'Якби у вас була чарівна паличка, яку одну бізнес-проблему ви б вирішили негайно?' },
];

type Answer = {
    questionId: number;
    textAnswer?: string;
    audioAnswer?: string; // URL to audio file
}

export default function AuditPage() {
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Handle audit completion
      alert('Аудит завершено!');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleVoiceRecord = () => {
      setIsRecording(prev => !prev);
      // Here you would integrate a voice recording library
      // For now, it's just a UI toggle
  }

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Panel: Questions & Input */}
      <div className="flex flex-col flex-1 p-4 md:p-8 lg:p-12 space-y-6">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <span className="text-3xl font-bold font-headline">{currentQuestion.id}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">{currentQuestion.text}</h1>
        </div>
        
        <div className="flex-1 flex flex-col space-y-4">
             <Textarea
                placeholder="Введіть вашу відповідь тут..."
                className="flex-1 text-base"
            />
             <div className="flex flex-col items-center justify-center gap-4 p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Або дайте відповідь голосом</p>
                <Button 
                    size="lg" 
                    className={`h-20 w-20 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
                    onClick={handleVoiceRecord}
                >
                    <Mic className="h-10 w-10" />
                </Button>
                {isRecording && <p className="text-sm text-red-500">Йде запис...</p>}
            </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <Button onClick={handleNext}>
            {currentQuestionIndex === questions.length - 1 ? 'Завершити' : 'Далі'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Panel: Progress */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-card border-l p-6 flex flex-col">
        <CardHeader className="p-0">
            <CardTitle>Прогрес аудиту</CardTitle>
            <CardDescription>Дайте відповідь на всі запитання, щоб отримати повний звіт.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 mt-6 space-y-4">
            <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">{currentQuestionIndex + 1} з {questions.length} запитань</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {questions.map((q, index) => (
                    <div 
                        key={q.id}
                        className={`p-2 rounded-md text-xs cursor-pointer ${index === currentQuestionIndex ? 'bg-primary/20 font-semibold' : 'hover:bg-muted'}`}
                        onClick={() => setCurrentQuestionIndex(index)}
                    >
                       {q.id}. {q.text}
                    </div>
                ))}
            </div>
        </CardContent>
      </aside>
    </div>
  );
}
