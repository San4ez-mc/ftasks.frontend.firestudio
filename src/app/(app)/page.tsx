
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Головна сторінка додатку - це сторінка задач.
  // Перенаправляємо будь-який трафік з кореня на /tasks.
  redirect('/tasks');
}
