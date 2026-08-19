"use client";

// app_build/apps/web/src/app/loyalty-cards/add/page.tsx

import React from "react";
import { AddLoyaltyCardForm } from "../../../components/loyalty/AddLoyaltyCardForm";

export default function AddLoyaltyCardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[24px] font-semibold text-[var(--es-ink)]">
        Ajouter une nouvelle carte
      </h1>
      <AddLoyaltyCardForm />
    </div>
  );
}
