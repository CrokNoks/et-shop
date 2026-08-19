"use client";

import { TabBar } from "@/components/layout/TabBar";

export default function LoyaltyCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-sans text-[#1A365D]">
      <main className="flex-1 p-6 pt-24 pb-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl">{children}</div>
      </main>
      <TabBar />
    </div>
  );
}
