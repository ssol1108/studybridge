"use client";

import { useState } from "react";
import { ConceptStep, QuizAttemptResult } from "@/types";

// 기능 4: 한 단계 = 개념 설명 + 퀴즈. 정답률 80% 미만이면 재학습, 이상이면 다음 단계로.
export default function LearningStep({
  step,
  stepIndex,
  totalSteps,
  onPassed,
}: {
  step: ConceptStep;
  stepIndex: number;
  totalSteps: number;
  onPassed: () => void;
}) {
  const [answers, setAnswers] = useState<number[]>(
    Array(step.quiz.length).fill(-1)
  );
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [attempt, setAttempt] = useState(1);

  const allAnswered = answers.every((a) => a >= 0);

  async function checkQuiz() {
    setChecking(true);
    try {
      const res = await fetch("/api/quiz/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stepId: step.id, quiz: step.quiz, answers }),
      });
      const data = await res.json();
      setResult(data.result);
      if (!data.result.passed) {
        setAttempt((a) => a + 1);
      }
    } finally {
      setChecking(false);
    }
  }

  function retry() {
    setAnswers(Array(step.quiz.length).fill(-1));
    setResult(null);
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="text-xs text-gray-500">
        배경지식 학습 {stepIndex + 1} / {totalSteps} 단계
        {attempt > 1 && ` · ${attempt}번째 시도`}
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">{step.concept}</h3>
        <p className="text-sm whitespace-pre-line">{step.explanation}</p>
      </div>

      <div className="flex flex-col gap-4">
        {step.quiz.map((q, qi) => (
          <div key={q.id} className="border rounded-lg p-4">
            <div className="text-sm font-medium mb-2">
              Q{qi + 1}. {q.question}
            </div>
            <div className="flex flex-col gap-1">
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[qi] === oi}
                    onChange={() =>
                      setAnswers((prev) => {
                        const next = [...prev];
                        next[qi] = oi;
                        return next;
                      })
                    }
                    disabled={!!result}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!result && (
        <button
          className="bg-black text-white rounded-md py-2 disabled:opacity-40"
          disabled={!allAnswered || checking}
          onClick={checkQuiz}
        >
          {checking ? "채점 중..." : "정답 확인"}
        </button>
      )}

      {result && (
        <div
          className={`rounded-md p-4 text-sm ${
            result.passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          <div className="font-medium mb-1">
            정답률 {Math.round(result.scoreRate * 100)}% ({result.correctCount}/
            {result.totalCount})
          </div>
          {result.passed ? (
            <>
              <p className="mb-2">80% 이상! 다음 단계로 넘어갈 수 있어요.</p>
              <button
                className="bg-black text-white rounded-md px-4 py-2"
                onClick={onPassed}
              >
                다음 단계로 →
              </button>
            </>
          ) : (
            <>
              <p className="mb-2">
                80%에 못 미쳐서 이 단계를 다시 학습해야 해요. 위 설명을 다시 읽고
                재도전해보세요.
              </p>
              <button
                className="bg-black text-white rounded-md px-4 py-2"
                onClick={retry}
              >
                다시 풀기
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
