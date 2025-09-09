
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProcessDetailPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <CardTitle>Розділ "Бізнес-процеси" тимчасово вимкнено</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Цей функціонал знаходиться на технічному обслуговуванні. Ми повернемо його найближчим часом.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
