
import ProcessEditor from '@/app/processes/[id]/_components/ProcessEditor';
import { getProcess } from '../actions';
import { mockUsers } from '@/data/process-mock';
import { notFound } from 'next/navigation';

type ProcessesPageProps = {
  params: { id: string };
};

export default async function Page({ params }: ProcessesPageProps) {
  const { id } = params;

  const process = await getProcess(id);
  const users = mockUsers; // TODO: Replace with real user data fetch

  if (!process) {
    notFound();
  }

  return (
    <ProcessEditor 
        initialProcess={process} 
        users={users} 
    />
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  const process = await getProcess(id);
  return { title: process ? process.name : 'Бізнес-процес' };
}
