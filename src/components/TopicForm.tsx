"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import { SUBJECTS } from "@/data/curriculum";
import { isGradeTypical } from "@/lib/gradeLevel";
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
  initialValue,
}: {
  onSubmit: (value: TopicFormValue) => void;
  loading: boolean;
  initialValue?: TopicFormValue;
}) {
  const initialSubject = initialValue
    ? SUBJECTS.find((s) => s.id === initialValue.subjectId)
    : undefined;

  const [category, setCategory] = useState(initialSubject?.category ?? CATEGORIES[0]);
  const [subjectId, setSubjectId] = useState(
    initialSubject?.id ?? SUBJECTS_BY_CATEGORY[category][0].id
  );
  const [unit, setUnit] = useState(initialValue?.unit ?? "");
  const [major, setMajor] = useState(initialValue?.major ?? "");
  const [grade, setGrade] = useState<Grade>(initialValue?.grade ?? "고1");

  const subjectsInCategory = SUBJECTS_BY_CATEGORY[category];
  const subject = subjectsInCategory.find((s) => s.id === subjectId)!;
  const gradeMismatch = !isGradeTypical(grade, subject.typicalGrade);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ subjectId, unit, major, grade });
      }}
    >
      <div>
        <label className={labelClass} htmlFor="tf-grade">학년</label>
        <select
          id="tf-grade"
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
          <label className={labelClass} htmlFor="tf-category">교과</label>
          <select
            id="tf-category"
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
          <label className={labelClass} htmlFor="tf-subject">과목</label>
          <select
            id="tf-subject"
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

      {gradeMismatch && (
        <p className="-mt-2 text-xs text-amber-600">
          ⚠ &ldquo;{subject.name}&rdquo;은(는) 보통 {subject.typicalGrade}에서 배우는
          과목이에요. {grade}이 아직 안 배웠을 수 있는 내용이라, 더 기초적인 설명 위주로
          진행할게요.
        </p>
      )}

      {subject.units.length > 0 && (
        <div>
          <label className={labelClass} htmlFor="tf-unit">
            단원 <span className="font-normal text-slate-400">(선택)</span>
          </label>
          <select
            id="tf-unit"
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
        <label className={labelClass} htmlFor="tf-major">전공 / 관심 분야</label>
        <input
          id="tf-major"
          className={fieldClass}
          placeholder="예: 심리학, 컴퓨터공학, 환경공학..."
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          maxLength={60}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !major}
        className="flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading && <Spinner />}
        {loading ? "탐구 주제 찾는 중..." : "융합 탐구 주제 추천받기"}
      </button>
    </form>
  );
}
