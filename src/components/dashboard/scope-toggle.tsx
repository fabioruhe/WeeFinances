"use client";

import type { DashboardScope } from "@/app/api/dashboard/route";

type Props = {
  scope: DashboardScope;
  onScopeChange: (s: DashboardScope) => void;
  partnerName: string | null;
};

const TABS: { value: DashboardScope; label: string; colorVar: string }[] = [
  { value: "meu", label: "Meu", colorVar: "var(--partner-a)" },
  { value: "nosso", label: "Nosso", colorVar: "var(--partner-shared)" },
  { value: "dele", label: "Dele(a)", colorVar: "var(--partner-b)" },
];

export function ScopeToggle({ scope, onScopeChange, partnerName }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex gap-1 p-1 rounded-full"
        style={{ background: "var(--bg-tertiary)" }}
        role="tablist"
      >
        {TABS.map((tab) => {
          const active = scope === tab.value;
          const label =
            tab.value === "dele" && partnerName ? `De ${partnerName.split(" ")[0]}` : tab.label;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={active}
              onClick={() => onScopeChange(tab.value)}
              className="px-4 py-1.5 text-sm font-medium transition-all"
              style={{
                borderRadius: "var(--radius-pill)",
                background: active ? tab.colorVar : "transparent",
                color: active ? "var(--text-inverse)" : "var(--text-secondary)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
