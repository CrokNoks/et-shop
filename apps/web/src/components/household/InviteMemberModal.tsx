"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import {
  UserIcon,
  TrashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  householdName: string;
}

interface MemberWithProfile {
  user_id: string;
  household_id: string;
  role: string;
  profile: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  householdId,
  householdName,
}) => {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi(`/households/${householdId}/members`);
      setMembers(data || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await fetchApi(`/households/${householdId}/members`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setEmail("");
      toast.success("Membre ajouté avec succès !");
      fetchMembers();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout du membre.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre du foyer ?")) return;
    try {
      await fetchApi(`/households/${householdId}/members/${userId}`, {
        method: "DELETE",
      });
      toast.success("Membre retiré.");
      fetchMembers();
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-lg rounded-t-[18px] p-6 pt-3 text-[var(--es-ink)] bg-[var(--es-surface)]"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--es-hairline)]" />
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-[20px] font-semibold">
            Inviter un membre
          </SheetTitle>
          <SheetDescription className="text-[13px] text-[var(--es-secondary)]">
            Foyer <span className="text-[#c8471c]">{householdName}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6">
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
              Inviter par email
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@ami.com"
                className="h-[48px] flex-1 rounded-[14px] text-[14.5px] font-medium focus-visible:ring-[#FF6B35]"
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-[48px] rounded-[14px] bg-[#FF6B35] px-5 hover:bg-[#e55a2b]"
              >
                Ajouter
              </Button>
            </div>
            <p className="text-[11.5px] text-[var(--es-tertiary)]">
              L&apos;utilisateur doit déjà avoir un compte Et SHop!.
            </p>
          </form>

          <div className="flex flex-col gap-3">
            <Label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]">
              Membres actuels
            </Label>
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="py-4 text-center text-[13px] italic text-[var(--es-tertiary)]">
                  Chargement des membres...
                </p>
              ) : members.length === 0 ? (
                <p className="py-4 text-center text-[13px] italic text-[var(--es-tertiary)]">
                  Aucun membre.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.user_id}
                    className="group flex items-center justify-between rounded-[12px] bg-[var(--es-field)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--es-hairline)] bg-[var(--es-surface)] text-[var(--es-ink)]">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-[14px] font-medium">
                          {member.profile?.full_name || member.profile?.email}
                          {member.role === "admin" && (
                            <ShieldCheckIcon className="w-4 h-4 text-[#FF6B35]" />
                          )}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-tight text-[var(--es-tertiary)]">
                          {member.role === "admin"
                            ? "Administrateur"
                            : "Membre"}
                        </span>
                      </div>
                    </div>
                    {member.role !== "admin" && (
                      <button
                        onClick={() => handleRemove(member.user_id)}
                        className="p-2 text-[var(--es-tertiary)] opacity-0 transition-all hover:text-[var(--es-danger)] group-hover:opacity-100"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
