"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { InviteMemberModal } from "@/components/household/InviteMemberModal";

export default function HouseholdSetupPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [createdHousehold, setCreatedHousehold] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkHouseholds() {
      try {
        const myHouseholds = await fetchApi("/households/me");
        if (myHouseholds && myHouseholds.length > 0) {
          localStorage.setItem("active_household_id", myHouseholds[0].id);
          router.push("/");
        } else {
          setChecking(false);
        }
      } catch (error: unknown) {
        console.error("Failed to check households:", error);
        // Si l'erreur est liée à l'auth, on redirige vers login
        const err = error as { message?: string; status?: number };
        if (err.message?.includes("auth") || err.status === 401) {
          router.push("/login");
        } else {
          setChecking(false);
        }
      }
    }
    checkHouseholds();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const household = await fetchApi("/households", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      localStorage.setItem("active_household_id", household.id);
      setCreatedHousehold(household);
      setStep(2);
      toast.success("Foyer créé avec succès !");
    } catch {
      toast.error("Erreur lors de la création du foyer.");
    } finally {
      setLoading(false);
    }
  };

  if (checking)
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--es-ink)]">
        <p className="animate-pulse font-medium">
          Vérification de votre foyer...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--es-bg)] flex flex-col items-center justify-center p-[18px] pt-3 text-[var(--es-ink)]">
      <div className="flex w-full max-w-md gap-1.5 pb-4">
        <div
          className={`h-[3px] flex-1 rounded-full ${step >= 1 ? "bg-[#FF6B35]" : "bg-[var(--es-hairline)]"}`}
        />
        <div
          className={`h-[3px] flex-1 rounded-full ${step >= 2 ? "bg-[#FF6B35]" : "bg-[var(--es-hairline)]"}`}
        />
      </div>

      {step === 1 ? (
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="flex flex-col items-center gap-3">
            <Logo width={160} height={48} />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-tertiary)]">
              Étape 1 sur 2
            </span>
            <h1 className="text-[25px] font-semibold text-center">
              Bienvenue !
            </h1>
            <p className="text-center text-[13px] text-[var(--es-secondary)]">
              Pour commencer à utiliser Et SHop!, créez un foyer (ex: {'"'}Ma
              Famille{'"'}, {'"'}Coloc{'"'}). Vous pourrez ensuite y inviter des
              membres.
            </p>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="h-name"
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-secondary)]"
              >
                Nom de votre foyer
              </Label>
              <Input
                id="h-name"
                data-cy="household-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Famille Dupont"
                className="h-[50px] rounded-[14px] text-[15px] font-medium focus-visible:ring-[#FF6B35]"
                required
              />
            </div>

            <Button
              type="submit"
              data-cy="household-submit"
              disabled={loading}
              className="h-[50px] rounded-[14px] bg-[#1A365D] text-[15px] font-semibold text-white hover:bg-[#1A365D]/90"
            >
              {loading ? "Création..." : "Créer mon foyer"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-tertiary)]">
            Étape 2 sur 2
          </span>
          <h1 className="text-[25px] font-semibold">Invitez votre foyer</h1>
          <p className="text-[13px] text-[var(--es-secondary)]">
            Partagez vos listes avec les membres de{" "}
            <span className="text-[var(--es-accent-text)]">
              {createdHousehold?.name}
            </span>{" "}
            pour une synchronisation en temps réel.
          </p>
          <Button
            onClick={() => setIsInviteOpen(true)}
            data-cy="household-invite-now"
            className="h-[50px] w-full rounded-[14px] bg-[#1A365D] text-[15px] font-semibold text-white hover:bg-[#1A365D]/90"
          >
            Inviter un membre
          </Button>
          <button
            onClick={() => router.push("/")}
            data-cy="household-invite-later"
            className="h-[42px] w-full text-[13px] font-medium text-[var(--es-secondary)]"
          >
            Plus tard
          </button>
        </div>
      )}

      {createdHousehold && (
        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => {
            setIsInviteOpen(false);
            router.push("/");
          }}
          householdId={createdHousehold.id}
          householdName={createdHousehold.name}
        />
      )}
    </div>
  );
}
