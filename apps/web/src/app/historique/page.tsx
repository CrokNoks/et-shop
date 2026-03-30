"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PurchaseHistoryList } from "@/components/purchases/PurchaseHistoryList";
import { PurchaseHistoryQuery } from "@/lib/api/purchases";
import { useStores } from "@/hooks/useStores";

export const dynamic = "force-dynamic";

export default function HistoriquePage() {
  const [query, setQuery] = useState<PurchaseHistoryQuery>({
    page: 1,
    limit: 20,
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [storeId, setStoreId] = useState("");
  const { data: stores = [] } = useStores();

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery({
      page: 1,
      limit: 20,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(storeId ? { storeId } : {}),
    });
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

          {/* Filters */}
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Du</label>
              <input
                data-cy="history-filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Au</label>
              <input
                data-cy="history-filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Magasin</label>
              <select
                data-cy="history-filter-store"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium"
              >
                <option value="">Tous</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <button
              data-cy="history-filter-submit"
              type="submit"
              className="px-6 py-3 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-[#e55a2b] transition-colors"
            >
              Filtrer
            </button>
          </form>

          <PurchaseHistoryList query={query} onPageChange={handlePageChange} />
        </div>
      </main>
    </div>
  );
}
