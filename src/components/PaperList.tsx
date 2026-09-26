"use client";

import { PaperSummary } from "@/types";

export type PaperStatus = "new" | "in-progress" | "done";

const BUTTON_LABEL: Record<PaperStatus, string> = {
  new: "이 논문으로 배경지식 학습 시작 →",
  "in-progress": "이어서 학습하기 →",
  done: "다시 학습하기 →",
};

const BUTTON_CLASS: Record<PaperStatus, string> = {
  new: "bg-accent text-white hover:bg-accent-hover",
  "in-progress": "bg-accent text-white hover:bg-accent-hover",
  done: "border border-accent text-accent hover:bg-accent/5",
};

export default function PaperList({
  papers,
  onSelect,
  statusByPaperId,
  loading,
}: {
  papers: PaperSummary[];
  onSelect: (paper: PaperSummary) => void;
  statusByPaperId: Record<string, PaperStatus>;
  loading?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 ${loading ? "opacity-50" : ""}`}>
      {papers.map((p) => {
        const status = statusByPaperId[p.id] ?? "new";
        return (
          <div
            key={p.id}
            className={`flex flex-col gap-3 rounded-xl border p-4 ${
              status === "done"
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium text-slate-900">{p.title}</span>{" "}
                <span className="text-xs text-slate-400">
                  ({p.authors}, {p.year})
                </span>
              </div>
              {status === "done" && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  학습 완료 ✓
                </span>
              )}
              {status === "in-progress" && (
                <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  학습 중
                </span>
              )}
            </div>
            <Field label="연구 배경" value={p.background} />
            <Field label="연구 목적" value={p.purpose} />
            <div>
              <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                핵심 개념
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.coreConcepts.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <Field label="연구 방법" value={p.method} />
            <Field label="연구 결과" value={p.results} />
            <button
              className={`self-start rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_CLASS[status]}`}
              onClick={() => onSelect(p)}
              disabled={loading}
            >
              {BUTTON_LABEL[status]}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {label}
      </div>
      <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{value}</p>
    </div>
  );
}
