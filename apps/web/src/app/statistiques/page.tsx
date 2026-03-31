"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useStatistics } from "@/hooks/useStatistics";
import { SpendingByCategory } from "@/components/statistics/SpendingByCategory";
import { TopItems } from "@/components/statistics/TopItems";

export const dynamic = "force-dynamic";

export default function StatistiquesPage() {
  const currentYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${currentYear}-01-01`);
  const [to, setTo] = useState(`${currentYear}-12-31`);

  const { data, isLoading, isError } = useStatistics(from, to);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-4xl flex flex-col gap-10">
          <header className="flex flex-col gap-2">
            <h1 className="text-4xl font-black">Statistiques</h1>
            <p className="text-gray-500">
              Analysez vos dépenses et habitudes d&apos;achat.
            </p>
          </header>

          {/* Date filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Du
              </label>
              <input
                data-cy="stats-filter-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Au
              </label>
              <input
                data-cy="stats-filter-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="p-3 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium"
              />
            </div>
          </div>

          {isLoading && (
            <p className="text-center py-20 text-gray-400 italic animate-pulse">
              Chargement des statistiques...
            </p>
          )}

          {isError && (
            <p className="text-center py-20 text-red-400 italic">
              Erreur lors du chargement des statistiques.
            </p>
          )}

          {data && (
            <div className="flex flex-col gap-10">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Total dépensé
                  </p>
                  <p data-cy="stats-total-spent" className="text-4xl font-black text-[#FF6B35]">
                    {data.totalSpent.toFixed(2)} €
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Achats enregistrés
                  </p>
                  <p data-cy="stats-total-items" className="text-4xl font-black text-[#1A365D]">
                    {data.totalItems}
                  </p>
                </div>
              </div>

              {/* By category */}
              <section data-cy="stats-section-by-category" className="flex flex-col gap-4">
                <h2 className="text-xl font-black">Dépenses par catégorie</h2>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <SpendingByCategory categories={data.byCategory} />
                </div>
              </section>

              {/* Top items */}
              <section data-cy="stats-section-top-items" className="flex flex-col gap-4">
                <h2 className="text-xl font-black">
                  Produits les plus achetés
                </h2>
                <TopItems items={data.topItems} />
              </section>

              {/* By month */}
              {data.byMonth.length > 0 && (
                <section data-cy="stats-section-by-month" className="flex flex-col gap-4">
                  <h2 className="text-xl font-black">Évolution mensuelle</h2>
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex flex-col gap-3">
                      {data.byMonth.map((m) => (
                        <div
                          key={m.month}
                          className="flex justify-between items-center"
                        >
                          <span className="font-bold text-[#1A365D]">
                            {new Date(m.month + "-01").toLocaleDateString(
                              "fr-FR",
                              { month: "long", year: "numeric" },
                            )}
                          </span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-gray-500">
                              {m.itemCount} achat{m.itemCount > 1 ? "s" : ""}
                            </span>
                            <span className="font-black text-[#FF6B35]">
                              {m.totalSpent.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
