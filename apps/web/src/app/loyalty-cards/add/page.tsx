"use client";

// app_build/apps/web/src/app/loyalty-cards/add/page.tsx

import React from "react";
import { AddLoyaltyCardForm } from "../../../components/loyalty/AddLoyaltyCardForm";

export default function AddLoyaltyCardPage() {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-4xl font-black">Ajouter une nouvelle carte</h1>
      <AddLoyaltyCardForm />
    </div>
  );
}
