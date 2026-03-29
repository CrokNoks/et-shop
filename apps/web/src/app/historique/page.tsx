"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PurchaseHistoryList } from "@/components/purchases/PurchaseHistoryList";
import { PurchaseHistoryQuery } from "@/lib/api/purchases";

export const dynamic = "force-dynamic";

export default function HistoriquePage() {
  const [query, setQuery] = useState<PurchaseHistoryQuery>({
    page: 1,
    limit: 20,
  });

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          <header className="flex flex-col gap-2">
            <h1 className="text-4xl font-black">Historique des Achats</h1>
            <p className="text-gray-500">
              Retrouvez l&apos;ensemble de vos achats enregistrés.
            </p>
          </header>

          <PurchaseHistoryList query={query} onPageChange={handlePageChange} />
        </div>
      </main>
    </div>
  );
}
