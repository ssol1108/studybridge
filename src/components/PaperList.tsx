"use client";

import { PaperSummary } from "@/types";

export default function PaperList({
  papers,
  onSelect,
}: {
  papers: PaperSummary[];
  onSelect: (paper: PaperSummary) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {papers.map((p) => (
        <div
          key={p.id}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4"
        >
          <div>
            <span className="font-medium text-slate-900">{p.title}</span>{" "}
            <span className="text-xs text-slate-400">
              ({p.authors}, {p.year})
            </span>
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
            className="self-start text-sm font-medium text-accent hover:text-accent-hover"
            onClick={() => onSelect(p)}
          >
            이 논문으로 배경지식 학습 시작 →
          </button>
        </div>
      ))}
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
