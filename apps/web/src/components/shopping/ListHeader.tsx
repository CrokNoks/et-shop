"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { useLogout } from "@/hooks/useLogout";
import { MemberAvatars } from "./MemberAvatars";
import { HouseholdMember } from "@/hooks/useHousehold";

interface ListHeaderProps {
  id: string;
  name: string;
  isSynced: boolean;
  householdName: string;
  members: HouseholdMember[];
  totalBudget: number;
  checkedTotal: number;
  onUpdate: (newName: string) => void;
  onDelete: () => void;
}

export const ListHeader: React.FC<ListHeaderProps> = ({
  id,
  name,
  isSynced,
  householdName,
  members,
  totalBudget,
  checkedTotal,
  onUpdate,
  onDelete,
}) => {
  const [isRenameSheetOpen, setIsRenameSheetOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isRenaming, setIsRenaming] = useState(false);
  const handleLogout = useLogout();

  const handleOpenRename = () => {
    setNewName(name);
    setIsRenameSheetOpen(true);
  };

  // Écran 4j : une liste n'a qu'un nom — ses sections magasin/rayon se
  // déduisent des produits qu'elle contient, aucun store_id à envoyer.
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRenaming(true);
    try {
      await fetchApi(`/shopping-lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      onUpdate(newName);
      toast.success("Liste mise à jour !");
      setIsRenameSheetOpen(false);
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement la liste "${name}" ?`)) return;
    try {
      await fetchApi(`/shopping-lists/${id}`, { method: "DELETE" });
      onDelete();
      toast.success("Liste supprimée !");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const budgetProgress =
    totalBudget > 0 ? (checkedTotal / totalBudget) * 100 : 0;

  return (
    <div className="bg-[var(--es-banner)] text-white px-3.5 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
            isSynced
              ? "text-[#16A34A] dark:text-[#4ADE80]"
              : "text-[#DC2626] dark:text-[#F87171]"
          }`}
        >
          <span
            className={`w-[5px] h-[5px] rounded-full ${
              isSynced ? "bg-[#16A34A]" : "bg-[#DC2626]"
            }`}
            style={{
              boxShadow: isSynced
                ? "0 0 0 3px rgba(22,163,74,.25)"
                : "0 0 0 3px rgba(220,38,38,.25)",
            }}
          />
          {isSynced ? "En direct" : "Hors ligne"} · {householdName}
        </span>

        <div className="flex items-center gap-1">
          <Link
            href="/lists"
            data-cy="open-lists"
            title="Mes listes & foyer"
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              data-cy="list-options"
              className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors outline-none"
              title="Plus d'options"
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-[var(--es-hairline)] bg-[var(--es-surface)] p-2 text-[var(--es-ink)] shadow-xl"
            >
              <DropdownMenuItem
                onClick={handleOpenRename}
                data-cy="list-edit"
                className="flex cursor-pointer items-center gap-3 rounded-xl p-3 font-semibold transition-colors hover:bg-[var(--es-field)] focus:bg-[var(--es-field)]"
              >
                <PencilIcon className="w-4 h-4 text-[var(--es-secondary)]" />
                Modifier la liste
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--es-hairline)]" />
              <DropdownMenuItem
                onClick={handleDelete}
                data-cy="list-delete"
                className="flex cursor-pointer items-center gap-3 rounded-xl p-3 font-semibold text-[var(--es-danger)] transition-colors hover:bg-[rgba(179,38,30,0.08)] focus:bg-[rgba(179,38,30,0.08)]"
              >
                <TrashIcon className="w-4 h-4" />
                Supprimer
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--es-hairline)]" />
              <DropdownMenuItem
                onClick={handleLogout}
                data-cy="logout-button"
                className="flex cursor-pointer items-center gap-3 rounded-xl p-3 font-semibold transition-colors hover:bg-[var(--es-field)] focus:bg-[var(--es-field)]"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4 text-[var(--es-secondary)]" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[23px] font-semibold tracking-[-0.01em] truncate">
          {name}
        </h1>
        <MemberAvatars members={members} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[27px] font-semibold tabular-nums">
            {totalBudget.toFixed(2)} €
          </span>
          <span className="text-[12.5px] text-white/60">Budget estimé</span>
        </div>
        <div className="h-0.5 rounded-full bg-white/16 overflow-hidden">
          <div
            className="h-full bg-[#FF6B35] transition-all duration-500 ease-out"
            style={{ width: `${budgetProgress}%` }}
          />
        </div>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/50">
          {checkedTotal.toFixed(2)} € dans le panier
        </span>
      </div>

      {/* Rename Sheet — écran 4j : uniquement le nom, les sections
          magasin/rayon se déduisent des produits de la liste. */}
      <Sheet open={isRenameSheetOpen} onOpenChange={setIsRenameSheetOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
        >
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-[20px] font-semibold">
              Modifier la liste
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
              Les magasins et rayons se déduisent des produits de la liste.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleRename} className="mt-6 flex flex-col gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="list-name"
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]"
              >
                Nom de la liste
              </Label>
              <Input
                id="list-name"
                data-cy="list-name-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-[50px] rounded-[14px] text-[15px] font-medium focus-visible:ring-[#FF6B35]"
                required
                autoFocus
              />
            </div>

            <SheetFooter className="mt-2 p-0 sm:justify-start">
              <Button
                type="submit"
                data-cy="list-name-submit"
                disabled={isRenaming}
                className="h-[50px] w-full rounded-[14px] bg-[#1A365D] text-[15px] font-semibold hover:bg-[#1A365D]/90"
              >
                {isRenaming ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};
