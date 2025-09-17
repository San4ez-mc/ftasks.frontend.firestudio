
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentFailurePage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                        <XCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Оплата не вдалася</CardTitle>
                    <CardDescription>
                        На жаль, виникла проблема під час обробки вашого платежу. Гроші не були списані.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Будь ласка, спробуйте ще раз або використайте інший спосіб оплати. Якщо проблема не зникає, зверніться до підтримки.
                    </p>
                    <Button asChild className="w-full">
                        <Link href="/settings/billing">Повернутися до сторінки оплати</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
