import { NextRequest, NextResponse } from "next/server";
import { QuizAttemptResult, QuizQuestion } from "@/types";

const PASS_RATE = 0.8; // 기능 4: 정답률 80% 이상이어야 다음 단계로 진행

// 퀴즈 채점: 80% 미만이면 해당 단계를 재학습해야 한다.
export async function POST(req: NextRequest) {
  const {
    stepId,
    quiz,
    answers,
  }: { stepId: string; quiz: QuizQuestion[]; answers: number[] } = await req.json();

  if (!stepId || !quiz || !answers) {
    return NextResponse.json({ error: "stepId, quiz, answers는 필수입니다." }, { status: 400 });
  }

  const correctCount = quiz.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
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
