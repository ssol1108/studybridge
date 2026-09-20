"use client";

import { useState } from "react";
import { SUBJECTS } from "@/data/curriculum";
import { Grade } from "@/types";

const GRADES: Grade[] = ["중1", "중2", "중3", "고1", "고2", "고3"];

export interface TopicFormValue {
  subjectId: string;
  unit: string;
  major: string;
  grade: Grade;
}

export default function TopicForm({
  onSubmit,
  loading,
}: {
  onSubmit: (value: TopicFormValue) => void;
  loading: boolean;
}) {
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [unit, setUnit] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState<Grade>("고1");

  const subject = SUBJECTS.find((s) => s.id === subjectId)!;

  return (
    <form
      className="flex flex-col gap-5 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ subjectId, unit, major, grade });
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-1">학년</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={grade}
          onChange={(e) => setGrade(e.target.value as Grade)}
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">2022 개정 교육과정 과목</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setUnit("");
          }}
        >
          {SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          단원 (선택, 지정하지 않으면 과목 전체 기준으로 제안)
        </label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="">전체 단원</option>
          {subject.units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">전공 / 관심 분야</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          placeholder="예: 심리학, 컴퓨터공학, 환경공학..."
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !major}
        className="bg-black text-white rounded-md py-2 disabled:opacity-40"
      >
        {loading ? "탐구 주제 찾는 중..." : "융합 탐구 주제 추천받기"}
      </button>
    </form>
  );
}
