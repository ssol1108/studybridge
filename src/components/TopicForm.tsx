"use client";

import { useState } from "react";
import { SUBJECTS } from "@/data/curriculum";
import { Grade } from "@/types";

const GRADES: Grade[] = ["고1", "고2", "고3"];

// 과목이 100개 가까이 되기 때문에 교과 → 과목 → 단원 3단계로 나눠서 고른다.
const SUBJECTS_BY_CATEGORY = SUBJECTS.reduce<Record<string, typeof SUBJECTS>>(
  (groups, subject) => {
    (groups[subject.category] ??= []).push(subject);
    return groups;
  },
  {}
);
const CATEGORY_ORDER = [
  "국어과",
  "수학과",
  "영어과",
  "과학과",
  "사회과",
  "정보과",
  "도덕과",
  "기술・가정과",
  "체육과",
  "음악과",
  "미술과",
];
const CATEGORIES = CATEGORY_ORDER.filter((c) => c in SUBJECTS_BY_CATEGORY);

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

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
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subjectId, setSubjectId] = useState(SUBJECTS_BY_CATEGORY[category][0].id);
  const [unit, setUnit] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState<Grade>("고1");

  const subjectsInCategory = SUBJECTS_BY_CATEGORY[category];
  const subject = subjectsInCategory.find((s) => s.id === subjectId)!;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ subjectId, unit, major, grade });
      }}
    >
      <div>
        <label className={labelClass}>학년</label>
        <select
          className={fieldClass}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>교과</label>
          <select
            className={fieldClass}
            value={category}
            onChange={(e) => {
              const nextCategory = e.target.value;
              setCategory(nextCategory);
              setSubjectId(SUBJECTS_BY_CATEGORY[nextCategory][0].id);
              setUnit("");
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>과목</label>
          <select
            className={fieldClass}
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setUnit("");
            }}
          >
            {subjectsInCategory.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {subject.units.length > 0 && (
        <div>
          <label className={labelClass}>
            단원 <span className="font-normal text-slate-400">(선택)</span>
          </label>
          <select
            className={fieldClass}
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
      )}

      <div>
        <label className={labelClass}>전공 / 관심 분야</label>
        <input
          className={fieldClass}
          placeholder="예: 심리학, 컴퓨터공학, 환경공학..."
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !major}
        className="rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "탐구 주제 찾는 중..." : "융합 탐구 주제 추천받기"}
      </button>
    </form>
  );
}
