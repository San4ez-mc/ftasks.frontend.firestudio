
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompanyPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Компанія</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Інформація про компанію</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Ця сторінка знаходиться в розробці.</p>
        </CardContent>
      </Card>
    </div>
  );
}
