"use client";

import { useState } from "react";
import TopicForm, { TopicFormValue } from "@/components/TopicForm";
import TopicResult from "@/components/TopicResult";
import PaperList from "@/components/PaperList";
import LearningStep from "@/components/LearningStep";
import StepIndicator from "@/components/StepIndicator";
import { SUBJECTS } from "@/data/curriculum";
import { ConceptStep, PaperSummary, TopicSuggestion } from "@/types";

type Stage = "topic-form" | "topic-result" | "papers" | "learning" | "done";

const STAGE_STEP: Record<Stage, number> = {
  "topic-form": 1,
  "topic-result": 1,
  papers: 2,
  learning: 3,
  done: 4,
};

const STAGE_LABEL: Record<Stage, string> = {
  "topic-form": "융합 탐구 주제를 찾아볼까요?",
  "topic-result": "마음에 드는 주제를 골라주세요",
  papers: "관련 논문을 하나 선택해주세요",
  learning: "배경지식을 단계별로 학습해요",
  done: "학습을 완료했어요",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("topic-form");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [steps, setSteps] = useState<ConceptStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  async function handleTopicSubmit(value: TopicFormValue) {
    setLoading(true);
    setError(null);
    setGrade(value.grade);
    try {
      const subject = SUBJECTS.find((s) => s.id === value.subjectId)!;
      const res = await fetch("/api/suggest-topic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: subject.name,
          unit: value.unit || undefined,
          major: value.major,
          grade: value.grade,
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setStage("topic-result");
    } catch {
      setError("주제 추천에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTopicSelect(topic: TopicSuggestion) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/find-papers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: topic.title, grade }),
      });
      const data = await res.json();
      setPapers(data.papers ?? []);
      setStage("papers");
    } catch {
      setError("논문 검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaperSelect(paper: PaperSummary) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-steps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paper, grade }),
      });
      const data = await res.json();
      setSteps(data.steps ?? []);
      setStepIndex(0);
      setStage("learning");
    } catch {
      setError("배경지식 단계 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleStepPassed() {
    if (stepIndex + 1 < steps.length) {
      setStepIndex((i) => i + 1);
    } else {
      setStage("done");
    }
  }

  return (
    <div className="flex min-h-screen justify-center px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-white shadow-sm">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            StudyBridge
          </h1>
          <p className="text-sm text-slate-500">
            교육과정 × 전공 융합 탐구 → 논문 학습 → 단계별 배경지식 학습
          </p>
        </header>

        <StepIndicator current={STAGE_STEP[stage]} />

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            {STAGE_LABEL[stage]}
          </h2>

          {stage === "topic-form" && (
            <TopicForm onSubmit={handleTopicSubmit} loading={loading} />
          )}

          {stage === "topic-result" && (
            <TopicResult suggestions={suggestions} onSelect={handleTopicSelect} />
          )}

          {stage === "papers" && (
            <PaperList papers={papers} onSelect={handlePaperSelect} />
          )}

          {stage === "learning" && steps[stepIndex] && (
            <LearningStep
              step={steps[stepIndex]}
              stepIndex={stepIndex}
              totalSteps={steps.length}
              onPassed={handleStepPassed}
            />
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="text-4xl">🎉</div>
              <p className="text-sm text-slate-600">
                이제 선택한 논문의 핵심 내용을 스스로 이해할 준비가 되었어요.
              </p>
              <button
                className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                onClick={() => {
                  setStage("topic-form");
                  setSuggestions([]);
                  setPapers([]);
                  setSteps([]);
                }}
              >
                새 주제로 다시 시작하기
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-4 text-sm text-slate-400">불러오는 중...</div>
          )}
        </main>
      </div>
    </div>
  );
}
