import { NextRequest, NextResponse } from "next/server";
import { QuizAnswer, QuizAttemptResult, QuizQuestion } from "@/types";

const PASS_RATE = 0.8; // 기능 4: 정답률 80% 이상이어야 다음 단계로 진행

// 퀴즈 채점: 80% 미만이면 해당 단계를 재학습해야 한다.
export async function POST(req: NextRequest) {
  const {
    stepId,
    quiz,
    answers,
  }: { stepId: string; quiz: QuizQuestion[]; answers: QuizAnswer[] } = await req.json();

  if (!stepId || !quiz || !answers) {
    return NextResponse.json({ error: "stepId, quiz, answers는 필수입니다." }, { status: 400 });
  }

  const correctCount = quiz.reduce(
    (acc, q, i) => acc + (isCorrect(q, answers[i]) ? 1 : 0),
    0
  );
  const scoreRate = quiz.length ? correctCount / quiz.length : 0;

  const result: QuizAttemptResult = {
    stepId,
    correctCount,
    totalCount: quiz.length,
    scoreRate,
    passed: scoreRate >= PASS_RATE,
  };

  return NextResponse.json({ result });
}

function isCorrect(question: QuizQuestion, answer: QuizAnswer): boolean {
  if (question.type === "multiple-choice") {
    return answer === question.answerIndex;
  }
  // 단답형: LLM 채점 없이, 정답으로 인정할 표현 목록과 정규화 비교로 판정한다
  // (공백 제거, 소문자화). 비용/지연 없이 바로 채점하기 위한 절충.
  if (typeof answer !== "string") return false;
  const normalized = normalize(answer);
  if (!normalized) return false;
  return question.acceptableAnswers.some((a) => normalize(a) === normalized);
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}
