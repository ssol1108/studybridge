const STEPS = ["주제 찾기", "논문 탐색", "배경지식 학습", "완료"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const state =
          stepNum < current ? "done" : stepNum === current ? "active" : "upcoming";
        const stateSuffix =
          state === "done" ? " (완료)" : state === "active" ? " (진행 중)" : "";
        return (
          <li
            key={label}
            className="flex items-center gap-2 sm:gap-3"
            aria-label={`${stepNum}단계: ${label}${stateSuffix}`}
            aria-current={state === "active" ? "step" : undefined}
          >
            <div aria-hidden="true" className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  state === "done" && "bg-accent text-white",
                  state === "active" &&
                    "bg-white text-accent ring-2 ring-accent",
                  state === "upcoming" &&
                    "bg-white text-slate-400 ring-1 ring-slate-200",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {state === "done" ? "✓" : stepNum}
              </div>
              <span
                className={[
                  "hidden text-xs sm:block",
                  state === "upcoming" ? "text-slate-400" : "text-slate-600",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {stepNum < STEPS.length && (
              <div
                aria-hidden="true"
                className={[
                  "h-px w-6 sm:w-10",
                  stepNum < current ? "bg-accent" : "bg-slate-200",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
