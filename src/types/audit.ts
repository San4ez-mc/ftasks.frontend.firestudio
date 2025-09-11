
export interface Audit {
    id: string;
    createdAt: string; // ISO date string
    isCompleted: boolean;
    answers: Record<number, string>; // question index -> answer
    summary: string;
    problems: string[];
    currentQuestionIndex: number;
    companyDescription?: string; // To store the answer to the first question
}
