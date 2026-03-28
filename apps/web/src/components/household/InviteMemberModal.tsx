"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-[#1A365D]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            Gestion du foyer
          </DialogTitle>
          <DialogDescription className="font-medium text-gray-500">
            Membres de <span className="text-[#FF6B35]">{householdName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">
              Inviter par email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@ami.com"
                className="flex-1 font-bold border-gray-200"
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FF6B35] hover:bg-[#e55a2b]"
              >
                Ajouter
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              L&apos;utilisateur doit déjà avoir un compte Et SHop!.
            </p>
          </form>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">
              Membres actuels
            </label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-center py-4 text-sm text-gray-400 animate-pulse italic">
                  Chargement des membres...
                </p>
              ) : members.length === 0 ? (
                <p className="text-center py-4 text-sm text-gray-400 italic">
                  Aucun membre.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[#1A365D]">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black flex items-center gap-1.5">
                          {member.profile?.full_name || member.profile?.email}
                          {member.role === "admin" && (
                            <ShieldCheckIcon className="w-4 h-4 text-[#FF6B35]" />
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                          {member.role === "admin"
                            ? "Administrateur"
                            : "Membre"}
                        </span>
                      </div>
                    </div>
                    {member.role !== "admin" && (
                      <button
                        onClick={() => handleRemove(member.user_id)}
                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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

        <DialogFooter className="pt-4 border-t border-gray-50">
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full font-bold"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
