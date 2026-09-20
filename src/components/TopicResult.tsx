"use client";

import { TopicSuggestion } from "@/types";

export default function TopicResult({
  suggestions,
  onSelect,
}: {
  suggestions: TopicSuggestion[];
  onSelect: (topic: TopicSuggestion) => void;
}) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h2 className="text-lg font-semibold">추천 융합 탐구 주제</h2>
      {suggestions.map((s) => (
        <div key={s.id} className="border rounded-lg p-4 flex flex-col gap-2">
          <div className="font-medium">{s.title}</div>
          <p className="text-sm text-gray-600">{s.description}</p>
          <button
            className="self-start text-sm underline"
            onClick={() => onSelect(s)}
          >
            이 주제로 논문 찾기 →
          </button>
        </div>
      ))}
    </div>
  );
}
