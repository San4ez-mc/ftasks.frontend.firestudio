
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminPaymentsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Оплати</CardTitle>
          <CardDescription>Загальний звіт по всіх оплатах в системі.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Звіт по оплатах буде доступний тут найближчим часом.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
