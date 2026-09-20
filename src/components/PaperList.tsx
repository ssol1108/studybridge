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
    <div className="flex flex-col gap-4 max-w-2xl">
      <h2 className="text-lg font-semibold">관련 논문 &amp; 학습용 재구성</h2>
      {papers.map((p) => (
        <div key={p.id} className="border rounded-lg p-4 flex flex-col gap-2">
          <div className="font-medium">
            {p.title}{" "}
            <span className="text-xs text-gray-500">
              ({p.authors}, {p.year})
            </span>
          </div>
          <Field label="연구 배경" value={p.background} />
          <Field label="연구 목적" value={p.purpose} />
          <div>
            <div className="text-xs font-semibold text-gray-500">핵심 개념</div>
            <ul className="list-disc list-inside text-sm">
              {p.coreConcepts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <Field label="연구 방법" value={p.method} />
          <Field label="연구 결과" value={p.results} />
          <button
            className="self-start text-sm underline"
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
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <p className="text-sm">{value}</p>
    </div>
  );
}
