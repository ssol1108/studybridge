"use client";

import { useState } from "react";
import TopicForm, { TopicFormValue } from "@/components/TopicForm";
import TopicResult from "@/components/TopicResult";
import PaperList from "@/components/PaperList";
import LearningStep from "@/components/LearningStep";
import { SUBJECTS } from "@/data/curriculum";
import { ConceptStep, PaperSummary, TopicSuggestion } from "@/types";

type Stage = "topic-form" | "topic-result" | "papers" | "learning" | "done";

const STAGE_LABEL: Record<Stage, string> = {
  "topic-form": "1. 융합 탐구 주제 찾기",
  "topic-result": "1. 융합 탐구 주제 찾기",
  papers: "2. 근거 논문 찾기 & 재구성",
  learning: "3-4. 배경지식 단계별 학습",
  done: "완료",
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
    <div className="min-h-screen p-8 sm:p-16 flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">StudyBridge</h1>
        <p className="text-sm text-gray-500">
          교육과정 x 전공 융합 탐구 → 논문 학습 → 단계별 배경지식 학습
        </p>
      </header>

      <nav className="text-xs text-gray-400">{STAGE_LABEL[stage]}</nav>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-md p-3 max-w-2xl">
          {error}
        </div>
      )}

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
        <div className="max-w-xl border rounded-lg p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">모든 배경지식 학습 완료 🎉</h2>
          <p className="text-sm text-gray-600">
            이제 선택한 논문의 핵심 내용을 스스로 이해할 준비가 되었어요.
          </p>
          <button
            className="self-start text-sm underline"
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
        <div className="text-sm text-gray-500">불러오는 중...</div>
      )}
    </div>
  );
}
