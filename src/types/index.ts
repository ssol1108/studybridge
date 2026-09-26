export type Grade = "고1" | "고2" | "고3";

export interface Subject {
  id: string;
  name: string;
  units: string[];
}

export interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  relatedUnit?: string;
  relatedMajor: string;
}

export interface PaperSummary {
  id: string;
  title: string;
  authors: string;
  year: number;
  url?: string;
  background: string;
  purpose: string;
  coreConcepts: string[];
  method: string;
  results: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface ConceptStep {
  id: string;
  order: number;
  concept: string;
  explanation: string;
  quiz: QuizQuestion[];
}

export interface QuizAttemptResult {
  stepId: string;
  correctCount: number;
  totalCount: number;
  scoreRate: number;
  passed: boolean;
}
