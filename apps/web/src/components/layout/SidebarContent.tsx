"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { ChefHat } from "lucide-react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { UserBadge } from "./UserBadge";
import { useSupabase } from "@/hooks/useSupabase";
import { ShoppingList } from "@/types";
import { InviteMemberModal } from "../household/InviteMemberModal";

interface SidebarContentProps {
  activeListId: string;
  onListSelect: (id: string) => void;
  onClose?: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  activeListId,
  onListSelect,
  onClose,
}) => {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newListName, setNewListName] = useState("");

  const loadData = useCallback(async () => {
    const householdId =
      typeof window !== "undefined"
        ? localStorage.getItem("active_household_id")
        : null;
    setActiveHouseholdId(householdId);
    if (!householdId) {
      setIsLoading(false);
      return;
    }

    try {
      // Charger les listes et le foyer en parallèle
      const [listsData, householdsData] = await Promise.all([
        fetchApi("/shopping-lists"),
        fetchApi("/households/me"),
      ]);

      setLists(listsData || []);

      const currentHousehold = householdsData.find(
        (h: { id: string; name: string }) => h.id === householdId,
      );
      if (currentHousehold) {
        setHouseholdName(currentHousehold.name);
      }
    } catch (error) {
      console.error("Failed to load sidebar data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const householdId =
      typeof window !== "undefined"
        ? localStorage.getItem("active_household_id")
        : null;
    if (!householdId) return;

    const channel = supabase
      .channel("sidebar_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_lists",
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadData]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const newList = await fetchApi("/shopping-lists", {
        method: "POST",
        body: JSON.stringify({ name: newListName }),
      });
      setNewListName("");
      setShowCreateForm(false);
      loadData();
      onListSelect(newList.id);
      onClose?.();
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleListClick = (id: string) => {
    onListSelect(id);
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <Logo width={200} height={60} />

      <div className="w-full flex flex-col gap-6 text-[var(--color-brand)]">
        {/* Magasins Link - Hidden on mobile */}
        <div className="px-2 hidden sm:flex flex-col gap-2">
          <Link
            href="/stores"
            onClick={() => onClose?.()}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              pathname === "/stores"
                ? "bg-white shadow-md border-l-4 border-[var(--color-accent)]"
                : "hover:bg-gray-50 border-l-4 border-transparent text-gray-500"
            }`}
          >
            <BuildingStorefrontIcon
              className={`w-5 h-5 ${pathname === "/stores" ? "text-[var(--color-accent)]" : "text-gray-400"}`}
              strokeWidth={2}
            />
            <span
              className={`font-bold ${pathname === "/stores" ? "text-[var(--color-brand)]" : ""}`}
            >
              Mes Magasins
            </span>
          </Link>
          <Link
            href="/recipes"
            onClick={() => onClose?.()}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              pathname.startsWith("/recipes")
                ? "bg-white shadow-md border-l-4 border-[var(--color-accent)]"
                : "hover:bg-gray-50 border-l-4 border-transparent text-gray-500"
            }`}
          >
            <ChefHat
              className={`w-5 h-5 ${pathname.startsWith("/recipes") ? "text-[var(--color-accent)]" : "text-gray-400"}`}
              strokeWidth={2}
            />
            <span
              className={`font-bold ${pathname.startsWith("/recipes") ? "text-[var(--color-brand)]" : ""}`}
            >
              Recettes
            </span>
          </Link>
          <Link
            href="/historique"
            onClick={() => onClose?.()}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              pathname.startsWith("/historique")
                ? "bg-white shadow-md border-l-4 border-[var(--color-accent)]"
                : "hover:bg-gray-50 border-l-4 border-transparent text-gray-500"
            }`}
          >
            <ClockIcon
              className={`w-5 h-5 ${pathname.startsWith("/historique") ? "text-[var(--color-accent)]" : "text-gray-400"}`}
              strokeWidth={2}
            />
            <span
              className={`font-bold ${pathname.startsWith("/historique") ? "text-[var(--color-brand)]" : ""}`}
            >
              Historique
            </span>
          </Link>
          <Link
            href="/statistiques"
            onClick={() => onClose?.()}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
              pathname.startsWith("/statistiques")
                ? "bg-white shadow-md border-l-4 border-[var(--color-accent)]"
                : "hover:bg-gray-50 border-l-4 border-transparent text-gray-500"
            }`}
          >
            <ChartBarIcon
              className={`w-5 h-5 ${pathname.startsWith("/statistiques") ? "text-[var(--color-accent)]" : "text-gray-400"}`}
              strokeWidth={2}
            />
            <span
              className={`font-bold ${pathname.startsWith("/statistiques") ? "text-[var(--color-brand)]" : ""}`}
            >
              Statistiques
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Mes Listes
          </h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            data-cy="sidebar-new-list"
            className={`p-1 hover:bg-gray-100 rounded-lg transition-colors ${showCreateForm ? "text-gray-400" : "text-[var(--color-accent)]"}`}
          >
            <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateList}
            className="px-2 mb-2 animate-in fade-in slide-in-from-top-2"
          >
            <input
              autoFocus
              data-cy="sidebar-list-input"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nom de la liste..."
              className="w-full p-3 bg-gray-50 border border-[var(--color-accent)]/30 rounded-xl outline-none focus:border-[var(--color-accent)] text-sm font-bold text-[var(--color-brand)]"
            />
          </form>
        )}

        <div className="flex flex-col gap-1 overflow-y-auto max-h-[40vh]">
          {isLoading && lists.length === 0 ? (
            <p className="text-xs text-center text-gray-400 italic py-4">
              Chargement...
            </p>
          ) : lists.length === 0 ? (
            <p className="text-xs text-center text-gray-400 italic py-4 px-2">
              Aucune liste. Cliquez sur + pour en créer une !
            </p>
          ) : (
            lists.map((list) => (
              <Link
                key={list.id}
                href={`/`}
                data-cy={`sidebar-list-${list.id}`}
                onClick={() => handleListClick(list.id)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                  activeListId === list.id
                    ? "bg-white shadow-md border-l-4 border-[var(--color-accent)]"
                    : "hover:bg-gray-50 border-l-4 border-transparent text-gray-500"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color || "var(--color-brand)" }}
                  />
                  <span
                    className={`font-bold truncate ${activeListId === list.id ? "text-[var(--color-brand)]" : ""}`}
                  >
                    {list.name}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="mt-4 pt-0 px-4 pb-4 bg-[var(--color-brand)]/5 rounded-2xl border border-[var(--color-brand)]/10">
          <div className="flex items-center gap-2 mb-2 pt-4">
            <UsersIcon className="w-4 h-4 text-[var(--color-brand)]" />
            <span className="text-xs font-bold text-[var(--color-brand)] uppercase tracking-wider">
              {householdName || "Foyer"}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight">
            Partagez vos listes avec vos proches pour une synchronisation en
            temps réel.
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="mt-3 w-full py-2 bg-white text-[var(--color-brand)] text-xs font-bold rounded-lg border border-[var(--color-brand)]/10 hover:shadow-sm transition-all"
          >
            Inviter un membre
          </button>
        </div>
      </div>

      <div className="mt-auto pt-8 border-t border-gray-100">
        <UserBadge initials="LG" name="Lucas Guerrier" plan="Compte Gratuit" />
      </div>

      {activeHouseholdId && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          householdId={activeHouseholdId}
          householdName={householdName || "Mon Foyer"}
        />
      )}
    </div>
  );
};
