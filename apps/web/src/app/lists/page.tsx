"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSupabase } from "@/hooks/useSupabase";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import {
  useActiveHousehold,
  useHouseholdMembers,
  getActiveHouseholdId,
} from "@/hooks/useHousehold";
import { useShoppingListItems } from "@/hooks/useShoppingListItems";
import { MemberAvatars } from "@/components/shopping/MemberAvatars";
import { InviteMemberModal } from "@/components/household/InviteMemberModal";
import { TabBar } from "@/components/layout/TabBar";

const ACTIVE_LIST_KEY = "active_list_id";

/** Écran 2g/3d — Mes listes & foyer. */
export default function ListsPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const household = useActiveHousehold();
  const householdId = getActiveHouseholdId();
  const { data: members = [] } = useHouseholdMembers(householdId);
  const { lists, isLoading, createList } = useShoppingLists();
  const [activeListId, setActiveListIdState] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(ACTIVE_LIST_KEY)
      : null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const activeList =
    lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;
  const { totalBudget, checkedTotal } = useShoppingListItems(
    activeList?.id ?? null,
  );
  const budgetProgress =
    totalBudget > 0 ? (checkedTotal / totalBudget) * 100 : 0;

  const otherLists = lists.filter((l) => l.id !== activeList?.id);

  const selectList = (id: string) => {
    setActiveListIdState(id);
    localStorage.setItem(ACTIVE_LIST_KEY, id);
    router.push("/");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setIsCreating(true);
    try {
      const list = await createList(newListName.trim());
      setNewListName("");
      setIsCreateOpen(false);
      selectList(list.id);
    } catch {
      toast.error("Erreur lors de la création de la liste.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("active_household_id");
    localStorage.removeItem(ACTIVE_LIST_KEY);
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--es-bg)] pb-24 text-[var(--es-ink)]">
      <div className="flex items-center gap-2 px-3.5 pt-6 pb-2">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
          aria-label="Retour"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-tertiary)]">
          Foyer {household?.name ?? ""}
        </span>
      </div>

      <div className="flex items-center justify-between px-3.5 pb-4">
        <h1 className="text-[24px] font-semibold">Mes listes</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          data-cy="lists-new-list"
          className="flex h-9 items-center gap-1 rounded-[10px] border border-[#FF6B35] px-3 text-[13px] font-semibold text-[#c8471c]"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          Nouvelle
        </button>
      </div>

      <div className="flex flex-col gap-4 px-3.5">
        {activeList && (
          <button
            onClick={() => selectList(activeList.id)}
            className="rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-banner)] p-3.5 text-left text-white"
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#FF6B35] dark:text-[#ffb694]">
              Liste active
            </span>
            <p className="mt-1 text-[21px] font-semibold">{activeList.name}</p>
            <div className="mt-2 h-0.5 rounded-full bg-white/16 overflow-hidden">
              <div
                className="h-full bg-[#FF6B35] transition-all duration-500 ease-out"
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
            <span className="mt-1 block text-[12px] text-white/60 tabular-nums">
              {checkedTotal.toFixed(2)} € / {totalBudget.toFixed(2)} €
            </span>
          </button>
        )}

        {!isLoading && otherLists.length > 0 && (
          <div className="flex flex-col overflow-hidden rounded-[14px] border border-[var(--es-hairline)]">
            {otherLists.map((list) => (
              <button
                key={list.id}
                onClick={() => selectList(list.id)}
                data-cy={`lists-item-${list.id}`}
                className="flex h-[60px] items-center gap-3 border-b border-[var(--es-hairline)] px-3.5 text-left last:border-b-0 hover:bg-[var(--es-field)]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: list.color || "#9397ab" }}
                />
                <span className="flex-1 truncate text-[15px] font-medium">
                  {list.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {!isLoading && lists.length === 0 && (
          <p className="py-6 text-center text-[13px] italic text-[var(--es-tertiary)]">
            Aucune liste. Créez-en une pour commencer.
          </p>
        )}

        <div className="mt-2 rounded-[14px] border border-[var(--es-hairline)] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">
              {household?.name ?? "Foyer"}
            </span>
            <MemberAvatars members={members} />
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            data-cy="invite-member-open"
            className="mt-3 h-[42px] w-full rounded-[10px] border border-[var(--es-hairline)] text-[13px] font-semibold"
          >
            Inviter un membre
          </button>
        </div>

        <button
          onClick={handleLogout}
          data-cy="logout-button"
          className="mt-2 flex h-[42px] items-center justify-center gap-2 rounded-[10px] text-[13px] font-medium text-[var(--es-secondary)]"
        >
          <ArrowLeftOnRectangleIcon className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              Nouvelle liste
            </SheetTitle>
            <SheetDescription className="text-[12.5px] text-[var(--es-secondary)]">
              Les magasins et rayons se déduisent automatiquement des produits
              que vous ajoutez.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="new-list-name"
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]"
              >
                Nom de la liste
              </Label>
              <Input
                id="new-list-name"
                data-cy="lists-list-input"
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Ex: Courses de la semaine"
                className="h-[50px] rounded-[14px] text-[15px] font-medium focus-visible:ring-[#FF6B35]"
                required
              />
            </div>
            <Button
              type="submit"
              data-cy="lists-create-submit"
              disabled={isCreating}
              className="h-[50px] rounded-[14px] bg-[#1A365D] text-[15px] font-semibold hover:bg-[#1A365D]/90"
            >
              {isCreating ? "Création..." : "Créer la liste"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {householdId && (
        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          householdId={householdId}
          householdName={household?.name || "Mon Foyer"}
        />
      )}

      <TabBar />
    </div>
  );
}
