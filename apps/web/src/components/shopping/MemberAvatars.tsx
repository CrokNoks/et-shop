"use client";

import React from "react";
import { HouseholdMember } from "@/hooks/useHousehold";

interface MemberAvatarsProps {
  members: HouseholdMember[];
  /**
   * Couleur de la bordure des avatars (doit correspondre au fond réel sur
   * lequel ils reposent, pour un effet de découpe entre cercles qui se
   * chevauchent). Par défaut le bandeau navy (usage historique dans
   * ListHeader) ; passer "var(--es-bg)" quand les avatars reposent sur le
   * fond de page plutôt que sur le bandeau (ex. bloc Foyer de /lists).
   */
  borderColor?: string;
}

const PALETTE = ["#FF6B35", "var(--es-secondary-purple)", "#2f6f5e", "#8a4321"];

function initialsFor(member: HouseholdMember): string {
  const label = member.profile?.full_name || member.profile?.email;
  if (!label) return "?";
  const parts = label.trim().split(/\s+/);
  const chars = parts.length > 1 ? [parts[0][0], parts[1][0]] : [parts[0][0]];
  return chars.join("").toUpperCase();
}

/**
 * Avatars ronds initiales (pas de photo — contrainte du design). Le nom des
 * autres membres du foyer dépend de la politique RLS sur `profiles`, qui
 * n'autorise aujourd'hui que la lecture de son propre profil : tant qu'elle
 * n'est pas élargie côté backend, les coéquipiers s'affichent avec un "?".
 */
export const MemberAvatars: React.FC<MemberAvatarsProps> = ({
  members,
  borderColor = "var(--es-banner)",
}) => {
  if (members.length === 0) return null;

  return (
    <div
      className="flex items-center"
      role="group"
      aria-label="Membres du foyer"
    >
      {members.map((member, index) => (
        <div
          key={member.user_id}
          title={member.profile?.full_name || member.profile?.email || "Membre"}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white border-2"
          style={{
            backgroundColor: PALETTE[index % PALETTE.length],
            borderColor,
            marginLeft: index === 0 ? 0 : "-9px",
          }}
        >
          {initialsFor(member)}
        </div>
      ))}
    </div>
  );
};
