type OnboardingStepperProps = {
  current: number;
  total: number;
  label?: string;
};

export function OnboardingStepper({ current, total, label }: OnboardingStepperProps) {
  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isActive = step === current;
          const isDone = step < current;
          return (
            <div
              key={step}
              aria-label={`Etapa ${step} de ${total}${isActive ? " (atual)" : isDone ? " (concluída)" : ""}`}
              className={[
                "rounded-full transition-all duration-300",
                isActive
                  ? "h-2.5 w-6 bg-brand-primary"
                  : isDone
                    ? "h-2 w-2 bg-brand-primary-muted"
                    : "h-2 w-2 bg-bg-tertiary",
              ].join(" ")}
            />
          );
        })}
      </div>
      <p className="text-xs text-text-tertiary">
        {label ?? `Etapa ${current} de ${total}`}
      </p>
    </div>
  );
}
