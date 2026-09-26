"use client";

import { TopicSuggestion } from "@/types";

export default function TopicResult({
  suggestions,
  onSelect,
  loading,
}: {
  suggestions: TopicSuggestion[];
  onSelect: (topic: TopicSuggestion) => void;
  loading?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-4 ${loading ? "opacity-50" : ""}`}>
      {suggestions.map((s) => (
        <div
          key={s.id}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 transition-colors hover:border-accent/40 hover:bg-accent/5"
        >
          <div className="font-medium text-slate-900">{s.title}</div>
          <p className="text-sm leading-relaxed text-slate-600">{s.description}</p>
          <button
            className="self-start text-sm font-medium text-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onSelect(s)}
            disabled={loading}
          >
            이 주제로 논문 찾기 →
          </button>
        </div>
      ))}
    </div>
  );
}
