import { Sidebar } from "@/components/nav/sidebar";
import { BottomTabs } from "@/components/nav/bottom-tabs";

export default function RelatoriosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}
