
import ProcessEditor from '@/app/(app)/processes/[id]/_components/ProcessEditor';
import { getProcess } from '../actions';
import { mockUsers } from '@/data/process-mock';
import { notFound } from 'next/navigation';
import { mockDepartments, mockDivisions, mockEmployees } from '@/data/org-structure-mock';
import type { Department, Division, Employee, Section } from '@/types/org-structure';

type ProcessesPageProps = {
  params: { id: string };
};

export default async function Page({ params }: ProcessesPageProps) {
  const { id } = params;

  const process = await getProcess(id);
  const users = mockUsers; // TODO: Replace with real user data fetch
  const departments: Department[] = mockDepartments;
  const divisions: Division[] = mockDivisions;
  const employees: Employee[] = mockEmployees;
  
  const allSections: (Section & { departmentName: string })[] = departments.flatMap(dept => 
      dept.sections.map(sec => ({
          ...sec,
          departmentName: dept.name
      }))
  );


  if (!process) {
    notFound();
  }

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
