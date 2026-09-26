export type Grade = "고1" | "고2" | "고3";

export interface Subject {
  id: string;
  name: string;
  category: string;
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

export type QuizQuestion =
  | {
      id: string;
      type: "multiple-choice";
      question: string;
      options: string[];
      answerIndex: number;
    }
  | {
      id: string;
      type: "short-answer";
      question: string;
      acceptableAnswers: string[];
    };

export type QuizAnswer = number | string;

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
