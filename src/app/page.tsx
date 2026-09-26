"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import TopicForm, { TopicFormValue } from "@/components/TopicForm";
import TopicResult from "@/components/TopicResult";
import PaperList, { PaperStatus } from "@/components/PaperList";
import LearningStep from "@/components/LearningStep";
import StepIndicator from "@/components/StepIndicator";
import { SUBJECTS } from "@/data/curriculum";
import { buildLevelNote } from "@/lib/gradeLevel";
import { clearSession, loadSession, saveSession } from "@/lib/sessionStorage";
import { ConceptStep, PaperSummary, TopicSuggestion } from "@/types";

type Stage = "topic-form" | "topic-result" | "papers" | "learning" | "done";

function isStage(value: string): value is Stage {
  return value in STAGE_STEP;
}

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
  papers: "논문을 하나씩 학습해보세요",
  learning: "배경지식을 단계별로 학습해요",
  done: "학습을 모두 완료했어요",
};

// "papers" 단계는 실제 논문 개수가 (최대 3개, 검색 결과에 따라 1~2개일 수도 있음) 고정이
// 아니라서, 제목에 "3개"라고 못 박지 않고 실제 개수를 반영해야 함.
function getStageLabel(stage: Stage, paperCount: number): string {
  if (stage === "papers" && paperCount > 0) {
    return `논문 ${paperCount}개를 하나씩 학습해보세요`;
  }
  return STAGE_LABEL[stage];
}

const LOADING_LABEL: Partial<Record<Stage, string>> = {
  "topic-result": "논문을 찾는 중이에요...",
  papers: "배경지식 단계를 만드는 중이에요...",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("topic-form");
  const [grade, setGrade] = useState("");
  const [levelNote, setLevelNote] = useState<string | undefined>(undefined);
  const [lastFormValue, setLastFormValue] = useState<TopicFormValue | null>(null);
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
  const [copied, setCopied] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);

  // 새로고침해도 진행 상태가 안 날아가도록: 마운트 시 한 번 localStorage에서 복원.
  // hydrated가 true가 되기 전까지는 저장 effect가 돌지 않게 해서, 복원되기도 전에
  // 기본값(빈 상태)으로 덮어써버리는 걸 막는다.
  // localStorage는 서버에 없는 값이라 lazy useState 초기값으로는 쓸 수 없음 (SSR에서
  // 렌더된 결과와 클라이언트 첫 렌더가 달라져 hydration mismatch가 남) - 그래서 마운트
  // 이펙트에서 읽어와 setState하는 이 패턴이 의도적인 선택이고, 일반적인 "effect 안에서
  // setState 하지 마라" 권고의 정당한 예외에 해당함.
  useEffect(() => {
    const persisted = loadSession();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 설명 참고
      if (isStage(persisted.stage)) setStage(persisted.stage);
      setGrade(persisted.grade ?? "");
      setLevelNote(persisted.levelNote);
      setLastFormValue(persisted.lastFormValue ?? null);
      setSuggestions(persisted.suggestions ?? []);
      setSelectedTopic(persisted.selectedTopic ?? null);
      setPapers(persisted.papers ?? []);
      setActivePaperId(persisted.activePaperId ?? null);
      setStepsByPaper(persisted.stepsByPaper ?? {});
      setStepIndexByPaper(persisted.stepIndexByPaper ?? {});
      setCompletedPaperIds(new Set(persisted.completedPaperIds ?? []));
      setSummary(persisted.summary ?? null);
      if (persisted.stage && persisted.stage !== "topic-form") {
        setShowRestoredBanner(true);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSession({
      stage,
      grade,
      levelNote,
      lastFormValue,
      suggestions,
      selectedTopic,
      papers,
      activePaperId,
      stepsByPaper,
      stepIndexByPaper,
      completedPaperIds: Array.from(completedPaperIds),
      summary,
    });
  }, [
    hydrated,
    stage,
    grade,
    levelNote,
    lastFormValue,
    suggestions,
    selectedTopic,
    papers,
    activePaperId,
    stepsByPaper,
    stepIndexByPaper,
    completedPaperIds,
    summary,
  ]);

  function statusOf(paperId: string): PaperStatus {
    if (completedPaperIds.has(paperId)) return "done";
    if (stepsByPaper[paperId]) return "in-progress";
    return "new";
  }

  async function handleTopicSubmit(value: TopicFormValue) {
    setLoading(true);
    setError(null);
    setGrade(value.grade);
    setLastFormValue(value);
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
      if (!res.ok) throw new Error(data.error || "주제 추천에 실패했습니다.");
      if (!data.suggestions?.length) {
        throw new Error("추천할 만한 주제를 찾지 못했어요. 전공/관심분야를 다르게 입력해보세요.");
      }
      setSuggestions(data.suggestions);
      setStage("topic-result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "주제 추천에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
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
      if (!res.ok) throw new Error(data.error || "논문 검색에 실패했습니다.");
      if (!data.papers?.length) {
        throw new Error("관련 논문을 찾지 못했어요. 다른 주제를 선택해보세요.");
      }
      setSelectedTopic(topic);
      setPapers(data.papers);
      setCompletedPaperIds(new Set());
      setStepsByPaper({});
      setStepIndexByPaper({});
      setStage("papers");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "논문 검색에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePaperSelect(paper: PaperSummary) {
    setActivePaperId(paper.id);

    if (stepsByPaper[paper.id]) {
      if (completedPaperIds.has(paper.id)) {
        // "다시 학습하기": 이미 완료한 논문은 이어하기가 아니라 처음 단계부터 복습하도록.
        setStepIndexByPaper((prev) => ({ ...prev, [paper.id]: 0 }));
      }
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
      if (!res.ok) throw new Error(data.error || "배경지식 단계 생성에 실패했습니다.");
      if (!data.steps?.length) {
        throw new Error("배경지식 단계를 만들지 못했어요. 다른 논문을 선택해보세요.");
      }
      setStepsByPaper((prev) => ({ ...prev, [paper.id]: data.steps }));
      setStepIndexByPaper((prev) => ({ ...prev, [paper.id]: prev[paper.id] ?? 0 }));
      setStage("learning");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "배경지식 단계 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
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
      if (!res.ok) throw new Error(data.error || "정리글 생성에 실패했습니다.");
      setSummary(data.summary ?? null);
    } catch {
      // 완료 축하 화면 위에 빨간 에러 배너까지 띄우는 건 과함 - 정리글 자리에 부드러운
      // 안내 문구만 넣어서, 학습 자체는 잘 끝났다는 걸 계속 강조한다.
      setSummary("정리글을 불러오지 못했어요. 그래도 학습은 잘 완료하셨어요!");
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

  async function handleCopySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("복사에 실패했습니다. 직접 선택해서 복사해주세요.");
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
    setShowRestoredBanner(false);
    clearSession();
  }

  // 헤더의 "처음부터 다시 시작"은 어디서든 누를 수 있는데, papers/learning 단계에서는
  // 논문 학습 진행 상황(퀴즈 통과 여부 등)이 걸려 있어서 실수로 누르면 되돌릴 수 없이
  // 다 날아간다. topic-result(주제 3개 추천만 받은 상태)는 다시 만드는 비용이 낮아 확인 없이
  // 바로 리셋해도 괜찮다고 판단.
  function handleHeaderReset() {
    const hasValuableProgress = stage === "papers" || stage === "learning";
    if (
      hasValuableProgress &&
      !window.confirm("정말 처음부터 다시 시작할까요? 지금까지의 학습 진행 상황이 모두 사라져요.")
    ) {
      return;
    }
    resetAll();
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
          {stage !== "topic-form" && (
            <button
              className="text-xs text-slate-400 underline hover:text-slate-600"
              onClick={handleHeaderReset}
            >
              처음부터 다시 시작
            </button>
          )}
        </header>

        <StepIndicator current={STAGE_STEP[stage]} />

        {showRestoredBanner && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-accent/5 px-4 py-3 text-sm text-slate-600">
            <span>이전에 하던 학습을 이어서 보고 있어요.</span>
            <button
              className="shrink-0 text-slate-400 hover:text-slate-600"
              onClick={() => setShowRestoredBanner(false)}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            {getStageLabel(stage, papers.length)}
          </h2>

          {loading && LOADING_LABEL[stage] && (
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
              <Spinner />
              {LOADING_LABEL[stage]}
            </div>
          )}

          {stage === "topic-form" && (
            <TopicForm
              onSubmit={handleTopicSubmit}
              loading={loading}
              initialValue={lastFormValue ?? undefined}
            />
          )}

          {stage === "topic-result" && (
            <div className="flex flex-col gap-4">
              <button
                className="self-start text-sm font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setStage("topic-form")}
              >
                ← 다시 조건 선택하기
              </button>
              <TopicResult
                suggestions={suggestions}
                onSelect={handleTopicSelect}
                loading={loading}
              />
            </div>
          )}

          {stage === "papers" && (
            <div className="flex flex-col gap-4">
              <button
                className="self-start text-sm font-medium text-slate-500 hover:text-slate-700"
                onClick={() => setStage("topic-result")}
              >
                ← 다른 주제 보기
              </button>
              <PaperList
                papers={papers}
                onSelect={handlePaperSelect}
                statusByPaperId={Object.fromEntries(
                  papers.map((p) => [p.id, statusOf(p.id)])
                )}
                loading={loading}
              />
            </div>
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
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                    학습 정리
                  </div>
                  {!summaryLoading && summary && (
                    <button
                      className="text-xs font-medium text-accent hover:text-accent-hover"
                      onClick={handleCopySummary}
                    >
                      {copied ? "복사됨 ✓" : "복사하기"}
                    </button>
                  )}
                </div>
                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Spinner />
                    정리글을 작성하는 중...
                  </div>
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
        </main>
      </div>
    </div>
  );
}
