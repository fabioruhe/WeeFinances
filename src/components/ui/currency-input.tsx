"use client";

import { useState, useEffect, useCallback } from "react";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseDigits(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

type CurrencyInputProps = {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function CurrencyInput({
  value,
  onChange,
  id,
  placeholder = "0,00",
  disabled,
  className,
  ...ariaProps
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => (value ? formatBRL(value) : ""));

  const sync = useCallback(() => {
    setDisplay(value ? formatBRL(value) : "");
  }, [value]);

  useEffect(() => { sync(); }, [sync]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDisplay("");
      onChange(0);
      return;
    }
    const num = parseDigits(raw);
    setDisplay(formatBRL(num));
    onChange(num);
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-text-tertiary">
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={
          className ??
          "h-10 w-full rounded-[10px] border border-border bg-bg-card py-2 pl-10 pr-3 text-sm font-medium text-text-primary outline-none transition focus:border-border-focus"
        }
        {...ariaProps}
      />
    </div>
  );
}
