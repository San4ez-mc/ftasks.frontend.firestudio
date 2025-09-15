
import { getProcess } from '../actions';
import { getOrgStructureData } from '../../org-structure/actions';
import ProcessEditor from './_components/ProcessEditor';
import { notFound } from 'next/navigation';
import type { Department, Division, Employee, Section } from '@/types/org-structure';

type ProcessesPageProps = {
  params: { id: string };
};

export default async function Page({ params }: ProcessesPageProps) {
  const { id } = params;

  const process = await getProcess(id);

  if (!process) {
    notFound();
  }

  // Fetch real org structure data from Firestore
  const { departments, employees } = await getOrgStructureData();
  
  const allSections: (Section & { departmentName: string })[] = departments.flatMap(dept => 
      (dept.sections || []).map(sec => ({
          ...sec,
          departmentName: dept.name
      }))
  );

  const users = employees.map(e => ({ id: e.id, name: e.name, avatar: e.avatar || '' }));


  return (
    <ProcessEditor 
        initialProcess={process} 
        users={users} 
        allSections={allSections}
        allEmployees={employees}
    />
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;
  const process = await getProcess(id);
  return { title: process ? process.name : 'Бізнес-процес' };
}
