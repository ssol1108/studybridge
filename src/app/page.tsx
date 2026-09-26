"use client";

import { useState } from "react";
import TopicForm, { TopicFormValue } from "@/components/TopicForm";
import TopicResult from "@/components/TopicResult";
import PaperList, { PaperStatus } from "@/components/PaperList";
import LearningStep from "@/components/LearningStep";
import StepIndicator from "@/components/StepIndicator";
import { SUBJECTS } from "@/data/curriculum";
import { buildLevelNote } from "@/lib/gradeLevel";
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
  papers: "논문 3개를 하나씩 학습해보세요",
  learning: "배경지식을 단계별로 학습해요",
  done: "학습을 모두 완료했어요",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("topic-form");
  const [grade, setGrade] = useState("");
  const [levelNote, setLevelNote] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [papers, setPapers] = useState<PaperSummary[]>([]);

  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [stepsByPaper, setStepsByPaper] = useState<Record<string, ConceptStep[]>>({});
  const [stepIndexByPaper, setStepIndexByPaper] = useState<Record<string, number>>({});
  const [completedPaperIds, setCompletedPaperIds] = useState<Set<string>>(new Set());

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  function statusOf(paperId: string): PaperStatus {
    if (completedPaperIds.has(paperId)) return "done";
    if (stepsByPaper[paperId]) return "in-progress";
    return "new";
  }

  async function handleTopicSubmit(value: TopicFormValue) {
    setLoading(true);
    setError(null);
    setGrade(value.grade);
    try {
      const subject = SUBJECTS.find((s) => s.id === value.subjectId)!;
      const note = buildLevelNote(value.grade, subject.name, subject.typicalGrade);
      setLevelNote(note);
      const res = await fetch("/api/suggest-topic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: subject.name,
          unit: value.unit || undefined,
          major: value.major,
          grade: value.grade,
          levelNote: note,
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
        body: JSON.stringify({
          topic: topic.title,
          searchQuery: topic.searchQuery,
          grade,
        }),
      });
      const data = await res.json();
      setSelectedTopic(topic);
      setPapers(data.papers ?? []);
      setCompletedPaperIds(new Set());
      setStepsByPaper({});
      setStepIndexByPaper({});
      setStage("papers");
    } catch {
      setError("논문 검색에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaperSelect(paper: PaperSummary) {
    setActivePaperId(paper.id);

    if (stepsByPaper[paper.id]) {
      setStage("learning");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-steps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paper, grade, levelNote }),
      });
      const data = await res.json();
      setStepsByPaper((prev) => ({ ...prev, [paper.id]: data.steps ?? [] }));
      setStepIndexByPaper((prev) => ({ ...prev, [paper.id]: prev[paper.id] ?? 0 }));
      setStage("learning");
    } catch {
      setError("배경지식 단계 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function generateSummary(finishedPaperIds: Set<string>) {
    if (!selectedTopic) return;
    setSummaryLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summarize-learning", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic.title,
          papers: papers.filter((p) => finishedPaperIds.has(p.id)),
          grade,
        }),
      });
      const data = await res.json();
      setSummary(data.summary ?? null);
    } catch {
      setError("정리글 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSummaryLoading(false);
    }
  }

  function handleStepPassed() {
    if (!activePaperId) return;
    const steps = stepsByPaper[activePaperId] ?? [];
    const currentIndex = stepIndexByPaper[activePaperId] ?? 0;

    if (currentIndex + 1 < steps.length) {
      setStepIndexByPaper((prev) => ({ ...prev, [activePaperId]: currentIndex + 1 }));
      return;
    }

    const nextCompleted = new Set(completedPaperIds).add(activePaperId);
    setCompletedPaperIds(nextCompleted);

    const allDone = papers.length > 0 && papers.every((p) => nextCompleted.has(p.id));
    if (allDone) {
      setStage("done");
      generateSummary(nextCompleted);
    } else {
      setStage("papers");
    }
  }

  function resetAll() {
    setStage("topic-form");
    setSuggestions([]);
    setSelectedTopic(null);
    setPapers([]);
    setStepsByPaper({});
    setStepIndexByPaper({});
    setCompletedPaperIds(new Set());
    setActivePaperId(null);
    setSummary(null);
    setLevelNote(undefined);
  }

  const activeSteps = activePaperId ? stepsByPaper[activePaperId] : undefined;
  const activeStepIndex = activePaperId ? stepIndexByPaper[activePaperId] ?? 0 : 0;
  const activeStep = activeSteps?.[activeStepIndex];

  return (
    <div className="flex min-h-screen justify-center px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="text-4xl">📖</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            StudyBridge
          </h1>
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
            <PaperList
              papers={papers}
              onSelect={handlePaperSelect}
              statusByPaperId={Object.fromEntries(
                papers.map((p) => [p.id, statusOf(p.id)])
              )}
            />
          )}

          {stage === "learning" && activeStep && (
            <div className="flex flex-col gap-4">
              <button
                className="self-start text-sm font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setStage("papers")}
              >
                ← 논문 목록으로
              </button>
              <LearningStep
                key={`${activePaperId}-${activeStep.id}`}
                step={activeStep}
                stepIndex={activeStepIndex}
                totalSteps={activeSteps?.length ?? 0}
                onPassed={handleStepPassed}
              />
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="text-4xl">🎉</div>
                <p className="text-sm text-slate-600">
                  논문 {papers.length}편 학습을 모두 완료하고 퀴즈까지 통과했어요.
                  배운 내용을 정리해봤어요.
                </p>
              </div>

              {selectedTopic && (
                <div className="rounded-xl bg-accent/5 p-4">
                  <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    탐구 주제
                  </div>
                  <div className="mt-1 font-medium text-slate-900">
                    {selectedTopic.title}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  학습 정리
                </div>
                {summaryLoading ? (
                  <p className="text-sm text-slate-400">정리글을 작성하는 중...</p>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
                    {summary}
                  </p>
                )}
              </div>

              <button
                className="rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:bg-accent-hover"
                onClick={resetAll}
              >
                새 주제로 다시 시작하기
              </button>
            </div>
          )}

          {loading && <div className="mt-4 text-sm text-slate-400">불러오는 중...</div>}
        </main>
      </div>
    </div>
  );
}
