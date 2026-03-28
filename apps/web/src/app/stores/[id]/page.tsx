"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { fetchApi } from "@/lib/api";
import { StoreCategories } from "@/components/stores/detail/StoreCategories";
import { StoreCatalog } from "@/components/stores/detail/StoreCatalog";
import {
  BuildingStorefrontIcon,
  ChevronLeftIcon,
  Squares2X2Icon,
  BookOpenIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { Store } from "@/types";
import { StoreLoyaltyCards } from "@/components/stores/detail/StoreLoyaltyCards";

export default function StoreDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<"rayons" | "produits" | "cartes">("rayons");
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
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar activeListId="" onListSelect={() => {}} />
        <main className="flex-1 p-12 flex justify-center items-center">
          <p className="text-gray-400 italic animate-pulse text-xl font-bold">
            Chargement du magasin...
          </p>
        </main>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row font-[family-name:var(--font-geist-sans)] text-[#1A365D]">
      <Sidebar activeListId="" onListSelect={() => {}} />

      <main className="flex-1 p-6 pt-24 sm:p-12 flex justify-center">
        <div className="w-full max-w-5xl flex flex-col gap-10">
          {/* Header */}
          <header className="flex flex-col gap-6">
            <button
              onClick={() => router.push("/stores")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#1A365D] font-bold transition-colors w-fit"
            >
              <ChevronLeftIcon className="w-4 h-4" strokeWidth={3} />
              Retour aux magasins
            </button>

            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-md flex items-center justify-center text-[#FF6B35]">
                <BuildingStorefrontIcon className="w-10 h-10" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-4xl font-black">{store.name}</h1>
                <p className="text-gray-500 font-medium">
                  Configuration personnalisée du magasin
                </p>
              </div>
            </div>
          </header>

          {/* Tabs Navigation */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("rayons")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === "rayons"
                  ? "bg-white text-[#1A365D] shadow-sm"
                  : "text-gray-500 hover:text-[#1A365D]"
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
              Rayons
            </button>
            <button
              onClick={() => setActiveTab("produits")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === "produits"
                  ? "bg-white text-[#1A365D] shadow-sm"
                  : "text-gray-500 hover:text-[#1A365D]"
              }`}
            >
              <BookOpenIcon className="w-5 h-5" />
              Produits
            </button>
            <button
              onClick={() => setActiveTab("cartes")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === "cartes"
                  ? "bg-white text-[#1A365D] shadow-sm"
                  : "text-gray-500 hover:text-[#1A365D]"
              }`}
            >
              <CreditCardIcon className="w-5 h-5" />
              Cartes
            </button>
          </div>

          {/* Content */}
          <div className="animate-in fade-in duration-500">
            {activeTab === "rayons" && <StoreCategories storeId={store.id} />}
            {activeTab === "produits" && <StoreCatalog storeId={store.id} />}
            {activeTab === "cartes" && (
              <StoreLoyaltyCards storeId={store.id} storeName={store.name} />
            )}
          </div>

          <footer className="mt-auto py-12 flex gap-6 flex-wrap items-center justify-center text-[#1A365D] opacity-40 text-xs text-center">
            <p>© 2026 Et SHop! - Votre compagnon de courses propulsionné 🚀</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
