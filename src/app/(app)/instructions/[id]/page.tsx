
import { getInstructionById } from '@/lib/firestore-service';
import InstructionEditor from './_components/InstructionEditor';
import { notFound, redirect } from 'next/navigation';
import { getUserSession } from '@/lib/session';
import { getEmployees } from '@/app/(app)/company/actions';

type InstructionsPageProps = {
  params: { id: string };
};

export default async function Page({ params }: InstructionsPageProps) {
  const { id } = params;
  const session = await getUserSession();

  if (!session) {
    redirect('/login');
  }

  const instruction = await getInstructionById(session.companyId, id);
  const allEmployees = await getEmployees();

  if (!instruction) {
    notFound();
  }

  return (
    <InstructionEditor
      instruction={instruction}
      allEmployees={allEmployees}
    />
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getUserSession();
  
  if (!session) {
    return { title: 'Інструкція' };
  }

  const instruction = await getInstructionById(session.companyId, id);
  return { title: instruction ? instruction.title : 'Інструкція' };
}
