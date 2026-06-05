import type { ReactNode } from "react";
import Link from "next/link";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <header className="flex items-center justify-center px-4 pt-8 pb-2">
        <Link href="/" className="font-display text-2xl italic text-brand-primary">
          Wee Finances
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-start px-4 py-6">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      <footer className="pb-6 text-center">
        <p className="text-xs text-text-tertiary">Seus dados são privados e protegidos.</p>
      </footer>
    </div>
  );
}
