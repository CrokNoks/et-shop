"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TabBar } from "@/components/layout/TabBar";
import { fetchApi } from "@/lib/api";
import { StoreCategories } from "@/components/stores/detail/StoreCategories";
import { StoreCatalog } from "@/components/stores/detail/StoreCatalog";
import {
  BuildingStorefrontIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { Store } from "@/types";
import { StoreLoyaltyCards } from "@/components/stores/detail/StoreLoyaltyCards";

export const dynamic = "force-dynamic";

export default function StoreDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<"rayons" | "produits" | "cartes">(
    "rayons",
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const stores = await fetchApi("/stores");
        const found = stores.find((s: Store) => s.id === id);
        if (found) {
          setStore(found);
        } else {
          router.push("/stores");
        }
      } catch (error) {
        console.error("Failed to fetch store:", error);
        router.push("/stores");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchStore();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--es-bg)]">
        <p className="py-20 text-center text-[13px] italic text-[var(--es-tertiary)]">
          Chargement du magasin...
        </p>
        <TabBar />
      </div>
    );
  }

  if (!store) return null;

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: "rayons", label: "Rayons" },
    { key: "produits", label: "Catalogue" },
    { key: "cartes", label: "Fidélité" },
  ];

  return (
    <div className="min-h-screen bg-[var(--es-bg)] pb-24 text-[var(--es-ink)]">
      <div className="flex items-center gap-2 px-3.5 pt-6 pb-2">
        <button
          onClick={() => router.push("/stores")}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-tertiary)]">
          Magasin
        </span>
      </div>

      <div className="flex items-center gap-4 px-3.5 pb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--es-field)] text-[#FF6B35]">
          <BuildingStorefrontIcon className="h-6 w-6" />
        </div>
        <h1 className="truncate text-[22px] font-semibold">{store.name}</h1>
      </div>

      <div
        role="tablist"
        aria-label="Sections du magasin"
        className="flex gap-1 rounded-[10px] bg-[var(--es-field-alt)] p-1 mx-3.5 w-fit"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`store-tab-${tab.key}-trigger`}
            aria-selected={activeTab === tab.key}
            // Les panneaux inactifs ne sont pas montés (chaque section
            // fait son propre fetch de données) : aria-controls ne doit
            // pointer que vers un id réellement présent dans le DOM.
            aria-controls={
              activeTab === tab.key ? `store-tabpanel-${tab.key}` : undefined
            }
            onClick={() => setActiveTab(tab.key)}
            data-cy={
              tab.key === "produits"
                ? "store-tab-catalogue"
                : `store-tab-${tab.key}`
            }
            className={`rounded-[8px] px-4 py-2 text-[13px] font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--es-surface)] text-[var(--es-ink)] shadow-[0_1px_2px_rgba(18,36,63,0.08)]"
                : "text-[var(--es-secondary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-3.5 pt-5">
        {activeTab === "rayons" && (
          <div
            role="tabpanel"
            id="store-tabpanel-rayons"
            aria-labelledby="store-tab-rayons-trigger"
          >
            <StoreCategories storeId={store.id} />
          </div>
        )}
        {activeTab === "produits" && (
          <div
            role="tabpanel"
            id="store-tabpanel-produits"
            aria-labelledby="store-tab-produits-trigger"
          >
            <StoreCatalog storeId={store.id} />
          </div>
        )}
        {activeTab === "cartes" && (
          <div
            role="tabpanel"
            id="store-tabpanel-cartes"
            aria-labelledby="store-tab-cartes-trigger"
          >
            <StoreLoyaltyCards storeId={store.id} storeName={store.name} />
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
