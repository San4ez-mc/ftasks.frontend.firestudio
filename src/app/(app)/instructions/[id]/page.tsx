
import { getInstructionById } from '@/lib/firestore-service';
import InstructionEditor from '@/components/instructions/InstructionEditor';
import { notFound } from 'next/navigation';

type InstructionsPageProps = {
  params: { id: string };
};

export default async function Page({ params }: InstructionsPageProps) {
  const { id } = params;
  const instruction = await getInstructionById(id);

  if (!instruction) {
    notFound();
  }

  return (
    <InstructionEditor
      instruction={instruction}
    />
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  const instruction = await getInstructionById(id);
  return { title: instruction ? instruction.title : 'Інструкція' };
}
