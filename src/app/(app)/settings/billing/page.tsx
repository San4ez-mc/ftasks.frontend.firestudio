'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { getSubscriptionStatus, type SubscriptionStatus, getCompanyId } from './actions';
import { Badge } from '@/components/ui/badge';

const freeFeatures = [
    "Задачі",
    "Результати",
    "Спрощена орг. структура"
];

const paidFeatures = [
    "Все, що у Безкоштовному тарифі",
    "Деталізована орг. структура",
    "Бізнес-процеси",
    "Інструкції",
    "Керування через Telegram-бот",
    "AI-аудит бізнесу"
];

// NOTE: You will need to create a separate button/product in Wayforpay for the yearly plan
// and replace the ID here. For now, it uses the same as the monthly plan.
const WAYFORPAY_MONTHLY_ID = 'b8af0361e2f89';
const WAYFORPAY_YEARLY_ID = 'b8af0361e2f89'; // REPLACE WITH ACTUAL YEARLY BUTTON ID


export default function BillingPage() {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        // This effect runs on the client, so `window` is available.
        setBaseUrl(window.location.origin);

        startTransition(async () => {
            const [subStatus, compId] = await Promise.all([
                getSubscriptionStatus(),
                getCompanyId()
            ]);
            setStatus(subStatus);
            setCompanyId(compId);
        });
    }, []);
    
    const getPaymentUrl = (planType: 'monthly' | 'yearly') => {
        if (!companyId || !baseUrl) return '#';
        
        const buttonId = planType === 'monthly' ? WAYFORPAY_MONTHLY_ID : WAYFORPAY_YEARLY_ID;

        const successUrl = `${baseUrl}/payment/success?plan=${planType}&companyId=${companyId}`;
        const failureUrl = `${baseUrl}/payment/failure`;

        return `https://secure.wayforpay.com/button/${buttonId}?merchantReturnUrl=${encodeURIComponent(successUrl)}&merchantFailUrl=${encodeURIComponent(failureUrl)}`;
    };

    const monthlyPaymentUrl = getPaymentUrl('monthly');
    const yearlyPaymentUrl = getPaymentUrl('yearly');


    const StatusCard = () => {
        if (isPending || !status) {
            return (
                 <Card>
                    <CardHeader>
                        <CardTitle>Поточний статус</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </CardContent>
                </Card>
            )
        }
        
        return (
            <Card className="bg-primary/5">
                <CardHeader>
                    <CardTitle>Ваш поточний статус</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">Тариф: <Badge className="text-lg">{status.planName}</Badge></p>
                    {status.daysRemaining !== null && (
                        <p className="mt-2">Залишилось днів: <span className="font-bold">{status.daysRemaining}</span></p>
                    )}
                    {status.tier === 'free' && (
                         <p className="mt-2 text-destructive">Ваш пробний період або платна підписка завершились.</p>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <h1 className="text-xl font-bold tracking-tight font-headline">Оплати та підписка</h1>
            <StatusCard />
            <div className="grid md:grid-cols-2 gap-8">
                <PlanCard
                    title="Безкоштовний"
                    price="0 грн"
                    description="Базовий функціонал для старту."
                    features={freeFeatures}
                    isCurrent={status?.tier === 'free'}
                />
                 <PlanCard
                    title="Повний доступ"
                    price="2000 грн"
                    pricePeriod="/місяць"
                    description="Весь функціонал для максимальної ефективності."
                    features={paidFeatures}
                    isCurrent={status?.tier === 'paid' || status?.tier === 'trial'}
                    isRecommended
                    paymentUrl={monthlyPaymentUrl}
                />
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Річна підписка</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-2xl font-bold">20 000 грн <span className="text-lg font-normal text-muted-foreground">/рік</span></p>
                        <p className="text-primary">Ви економите 4000 грн!</p>
                    </div>
                    <Button asChild size="lg" disabled={yearlyPaymentUrl === '#'}>
                        <Link href={yearlyPaymentUrl}>
                             Оплатити за рік <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function PlanCard({ title, price, pricePeriod, description, features, isCurrent, isRecommended, paymentUrl }: {
    title: string;
    price: string;
    pricePeriod?: string;
    description: string;
    features: string[];
    isCurrent?: boolean;
    isRecommended?: boolean;
    paymentUrl?: string;
}) {
    return (
        <Card className={isRecommended ? "border-2 border-primary" : ""}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{title}</span>
                    {isCurrent && <Badge variant="secondary">Ваш тариф</Badge>}
                </CardTitle>
                <p className="text-2xl font-bold">{price} <span className="text-lg font-normal text-muted-foreground">{pricePeriod}</span></p>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                    {features.map(feature => (
                        <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                {!isCurrent && paymentUrl && (
                    <Button asChild className="w-full" variant={isRecommended ? "default" : "outline"} disabled={paymentUrl === '#'}>
                        <Link href={paymentUrl}>
                            {isRecommended ? "Перейти на цей тариф" : "Обрати"}
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
