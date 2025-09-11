
export type InstructionAccess = {
    userId: string;
    access: 'view' | 'edit';
};

export interface Instruction {
  id: string;
  title: string;
  department: string;
  summary: string;
  content: string; // Stored as HTML or Markdown
  accessList: InstructionAccess[];
}
