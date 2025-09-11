
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Loader2, Wand2, AlertTriangle, Mic } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { generateAuditSummary } from '@/ai/flows/audit-summary-flow';
import { useToast } from '@/hooks/use-toast';
import { getAudit, updateAudit } from '../actions';
import type { Audit } from '@/types/audit';

const auditSections = [
  {
    title: 'Загальне бачення та Стратегія',
    questions: [
      'Розкажіть, чим займається ваша компанія?',
      'Опишіть головний бізнес-процес вашої компанії одним реченням: звідки приходять клієнти і який кінцевий продукт вони отримують?',
      'Яка головна фінансова мета компанії на найближчий рік (наприклад, оборот, прибуток)?',
      'Хто у компанії відповідальний за досягнення цієї фінансової мети? Чиї рішення на це впливають найбільше?',
    ],
  },
  {
    title: 'Маркетинг та Залучення клієнтів',
    questions: [
      'Перерахуйте 2-3 основні канали, звідки приходять клієнти. Хто відповідає за роботу кожного каналу?',
      'Які ключові метрики ви використовуєте для оцінки ефективності маркетингу (наприклад, вартість ліда, ROMI)?',
      'Чи бере власник участь в операційній роботі з маркетингу (наприклад, налаштування реклами, написання текстів)?',
    ],
  },
  {
    title: 'Продажі та Робота з клієнтами',
    questions: [
      'Опишіть коротко процес продажу: від першого контакту до отримання оплати. Хто є ключовою особою на кожному етапі?',
      'Чи є у відділі продажів скрипти, регламенти або CRM-система? Наскільки системно вони використовуються?',
      'Хто в компанії є найкращим продавцем? Наскільки сильно впадуть продажі, якщо ця людина піде у відпустку на місяць?',
    ],
  },
  {
    title: 'Продукт та Виробництво',
    questions: [
      'Хто відповідає за якість кінцевого продукту чи послуги? Як ви цю якість вимірюєте?',
      'Чи є у вас задокументовані процеси або інструкції для створення продукту чи надання послуги?',
      'Наскільки сильно ви, як власник, залучені у процес виробництва або надання послуг клієнтам?',
    ],
  },
  {
      title: 'Команда та Найм',
      questions: [
          'Хто ухвалює остаточне рішення про найм нового співробітника?',
          'Чи є у вас програма адаптації (онбордингу) для нових членів команди?',
          'Які ключові співробітники, крім власника, "незамінні"? Що станеться, якщо вони раптово звільняться?',
      ]
  },
  {
      title: 'Фінанси та Управління',
      questions: [
          'Хто в компанії регулярно веде фінансовий облік (P&L, Cash Flow)? Як часто власник переглядає ці звіти?',
          'Хто приймає рішення про ключові витрати в компанії?',
          'Які задачі ви, як власник, виконували протягом останнього тижня? Перерахуйте 5-7 основних.',
      ]
  }
];

const allQuestions = auditSections.flatMap(section =>
  section.questions.map(q => ({ text: q, section: section.title }))
);

type AuditPageProps = {
  params: { id: string };
};

export default function AuditPage({ params }: AuditPageProps) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isInitialAudit, setIsInitialAudit] = useState(false);

  useEffect(() => {
      startTransition(async () => {
          const fetchedAudit = await getAudit(params.id);
          if (fetchedAudit) {
              setAudit(fetchedAudit);
              // Simple logic: if no answers to first question, it's the first audit.
              setIsInitialAudit(!fetchedAudit.answers?.[0]);
          } else {
              toast({ title: "Помилка", description: "Аудит не знайдено.", variant: "destructive"});
              router.push('/audit');
          }
      });
  }, [params.id, router, toast]);

  if (!audit) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }

  const currentQuestionIndex = audit.currentQuestionIndex;
  // Skip first question if it's not the initial audit
  const questionsToAsk = allQuestions.slice(isInitialAudit ? 0 : 1);
  const question = questionsToAsk[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questionsToAsk.length) * 100;

  const handleAnswerChange = (text: string) => {
    const questionIndexInDb = isInitialAudit ? currentQuestionIndex : currentQuestionIndex + 1;
    setAudit(prev => prev ? ({...prev, answers: {...prev.answers, [questionIndexInDb]: text}}) : null);
  }

  const handleNext = () => {
    const questionIndexInDb = isInitialAudit ? currentQuestionIndex : currentQuestionIndex + 1;
    const currentAnswer = audit.answers[questionIndexInDb];
    if (!currentAnswer || currentAnswer.trim().length < 5) {
        toast({
            title: "Будь ласка, дайте відповідь",
            description: "Надайте більш розгорнуту відповідь на запитання.",
            variant: "destructive"
        });
        return;
    }

    startTransition(async () => {
        try {
            const result = await generateAuditSummary({
                currentSummary: audit.summary === 'Аудит ще не розпочато.' ? '' : audit.summary,
                identifiedProblems: audit.problems,
                question: question.text,
                answer: currentAnswer,
            });

            const nextIndex = currentQuestionIndex + 1;
            const isCompleted = nextIndex >= questionsToAsk.length;
            
            const updates: Partial<Audit> = {
                summary: result.updatedSummary,
                problems: result.updatedProblems,
                answers: audit.answers,
                currentQuestionIndex: isCompleted ? currentQuestionIndex : nextIndex,
                isCompleted: isCompleted,
            };

            // If it's the first question of the first audit, save the company description
            if (isInitialAudit && currentQuestionIndex === 0) {
                updates.companyDescription = currentAnswer;
            }

            const updatedAudit = await updateAudit(audit.id, updates);
            if (updatedAudit) {
                setAudit(updatedAudit);
            }

            if (isCompleted) {
                 toast({
                    title: "Аудит завершено!",
                    description: "Ваш фінальний звіт готовий. Ви можете переглянути його в списку аудитів.",
                });
                router.push('/audit');
            }

        } catch (error) {
            toast({
                title: "Помилка ШІ",
                description: "Не вдалося обробити вашу відповідь. Спробуйте ще раз.",
                variant: "destructive"
            });
        }
    });
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      startTransition(async () => {
        const updatedAudit = await updateAudit(audit.id, { currentQuestionIndex: newIndex });
        if (updatedAudit) setAudit(updatedAudit);
      });
    }
  };
  
  const isLastQuestion = currentQuestionIndex >= questionsToAsk.length - 1;
  const questionIndexInDb = isInitialAudit ? currentQuestionIndex : currentQuestionIndex + 1;

  if (!question) {
       return <div className="flex items-center justify-center h-full">Аудит завершено або не знайдено запитань.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Panel: Questions & Input */}
      <div className="flex flex-col flex-1 p-4 md:p-8 lg:p-12 space-y-6">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <span className="text-3xl font-bold font-headline">{currentQuestionIndex + 1}</span>
            </div>
            <div>
                 <p className="text-sm font-semibold text-primary">{question.section}</p>
                 <h1 className="text-2xl md:text-3xl font-bold font-headline">{question.text}</h1>
            </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Textarea
                placeholder="Введіть вашу відповідь тут..."
                className="flex-1 text-base h-full md:col-span-2"
                value={audit.answers[questionIndexInDb] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
            />
            <div className="flex flex-col items-center justify-center text-center p-4 bg-muted/50 rounded-lg">
                <Button variant="ghost" size="icon" className="h-20 w-20 rounded-full bg-background mb-4">
                    <Mic className="h-10 w-10 text-primary" />
                </Button>
                <h4 className="font-semibold">Запишіть аудіо-відповідь</h4>
                <p className="text-xs text-muted-foreground mt-1">
                    Рекомендуємо записувати розгорнуті відповіді голосом. Розповідайте з максимальною кількістю деталей — це допоможе ШІ надати вам найточніші рекомендації.
                </p>
            </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
           <div className="flex-1 text-center px-4">
             <Progress value={progress} />
           </div>
          <Button onClick={handleNext} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLastQuestion ? 'Завершити' : 'Далі'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Panel: Summary */}
      <aside className="w-full md:w-1/3 lg:w-1/4 bg-card border-l p-6 flex flex-col">
        <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2">
                <Wand2/>
                Аналітичне резюме
            </CardTitle>
            <CardDescription>Результати оновлюються після кожної вашої відповіді.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 mt-6 space-y-4 overflow-y-auto">
           <div className="space-y-1">
                <h4 className="text-sm font-semibold">Загальне резюме</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{audit.summary}</p>
           </div>
           <div className="space-y-2">
                <h4 className="text-sm font-semibold">Виявлені проблеми та ризики</h4>
                {audit.problems.length > 0 ? (
                    <ul className="space-y-2">
                        {audit.problems.map((problem, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5"/>
                                <span>{problem}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">Проблем поки не виявлено.</p>
                )}
           </div>
        </CardContent>
      </aside>
    </div>
  );
}
