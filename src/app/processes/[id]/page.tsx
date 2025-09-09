
// SERVER component (за замовчуванням у app/)
// ВАЖЛИВО: тут не використовуємо useState/useEffect/useRouter — усе інтерактивне винесемо у клієнтський компонент
import ProcessEditor from './_components/ProcessEditor';
import { mockInitialProcess, mockUsers } from '@/data/process-mock';

type ProcessesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ProcessesPageProps) {
  const { id } = await params;

  // Завантаження даних на сервері (приклад — заміни на свою функцію)
  const process = mockInitialProcess; // В реальності: await getProcessById(id);
  const users = mockUsers; // В реальності: await getUsers();

  // Передаємо дані у клієнтський компонент
  return (
    <ProcessEditor 
        initialProcess={process} 
        users={users} 
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Process ${id}` };
}
