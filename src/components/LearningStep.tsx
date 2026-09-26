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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-slate-400">
          {stepIndex + 1} / {totalSteps} 단계
          {attempt > 1 && ` · ${attempt}번째 시도`}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i <= stepIndex ? "bg-accent" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-accent/5 p-4">
        <h3 className="mb-2 font-semibold text-slate-900">{step.concept}</h3>
        <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
          {step.explanation}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {step.quiz.map((q, qi) => (
          <div key={q.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-medium text-slate-900">
              Q{qi + 1}. {q.question}
            </div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-accent bg-accent/5 text-slate-900"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    } ${result ? "cursor-default" : ""}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="accent-accent"
                      checked={selected}
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
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!result && (
        <button
          className="rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!allAnswered || checking}
          onClick={checkQuiz}
        >
          {checking ? "채점 중..." : "정답 확인"}
        </button>
      )}

      {result && (
        <div
          className={`rounded-xl p-4 text-sm ${
            result.passed
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <div className="mb-1 font-medium">
            정답률 {Math.round(result.scoreRate * 100)}% ({result.correctCount}/
            {result.totalCount})
          </div>
          {result.passed ? (
            <>
              <p className="mb-3">80% 이상! 다음 단계로 넘어갈 수 있어요.</p>
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
                onClick={onPassed}
              >
                다음 단계로 →
              </button>
            </>
          ) : (
            <>
              <p className="mb-3">
                80%에 못 미쳐서 이 단계를 다시 학습해야 해요. 위 설명을 다시 읽고
                재도전해보세요.
              </p>
              <button
                className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
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
