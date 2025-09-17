
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { processSuccessfulPayment } from '@/app/(app)/settings/billing/actions';

async function PaymentProcessor({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const companyId = searchParams?.companyId as string;
    const planType = searchParams?.plan as 'monthly' | 'yearly';
    
    if (!companyId || !planType) {
        return (
            <div>
                <CardTitle className="mt-4 text-destructive">Помилка обробки</CardTitle>
                <CardDescription>
                    Відсутні необхідні параметри для завершення оплати. Будь ласка, зверніться до підтримки.
                </CardDescription>
            </div>
        );
    }

    const result = await processSuccessfulPayment(companyId, planType);
    
    if (!result.success) {
         return (
            <div>
                <CardTitle className="mt-4 text-destructive">Помилка оновлення підписки</CardTitle>
                <CardDescription>
                    Ваш платіж успішний, але виникла помилка при оновленні статусу вашої підписки. Будь ласка, зверніться до підтримки, ми все виправимо.
                </CardDescription>
            </div>
        );
    }

    return (
        <div>
            <CardTitle className="mt-4">Оплата успішна!</CardTitle>
            <CardDescription>
                Дякуємо! Вашу підписку було успішно оновлено.
            </CardDescription>
        </div>
    );
}


export default function PaymentSuccessPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                        <CheckCircle className="h-10 w-10 text-primary" />
                    </div>
                    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto mt-4" />}>
                        <PaymentProcessor searchParams={searchParams} />
                    </Suspense>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full mt-4">
                        <Link href="/">Перейти в додаток</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
