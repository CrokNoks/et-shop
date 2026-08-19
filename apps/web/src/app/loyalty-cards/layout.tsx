"use client";

import { TabBar } from "@/components/layout/TabBar";

export default function LoyaltyCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--es-bg)] flex flex-col sm:flex-row font-sans text-[var(--es-ink)]">
      <main className="flex-1 px-3.5 pt-6 pb-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-lg sm:max-w-4xl">{children}</div>
      </main>
      <TabBar />
    </div>
  );
}
