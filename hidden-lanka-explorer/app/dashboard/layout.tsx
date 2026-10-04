import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#17231c]">
      <header className="border-b border-[#d7cfbf] bg-[#fffdf9]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#718078]">
              Hidden Lanka
            </p>
            <h1 className="text-lg font-bold text-[#0b2417]">Admin dashboard</h1>
          </div>

          <div className="rounded-full border border-[#d7cfbf] bg-[#f1e7d6] px-3 py-1 text-sm font-medium text-[#123b26]">
            Review queue
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
