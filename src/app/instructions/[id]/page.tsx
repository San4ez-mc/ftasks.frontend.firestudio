
// SERVER component (за замовчуванням у app/)
import InstructionEditor from './_components/InstructionEditor';

type InstructionsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: InstructionsPageProps) {
  const { id } = await params;

  // Завантаження даних на сервері (приклад — заміни на свою функцію)
  // const instruction = await getInstructionById(id);

  // Передаємо дані у клієнтський компонент
  return (
    <InstructionEditor
      id={id}
      // initialData={instruction}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Instruction ${id}` };
}
