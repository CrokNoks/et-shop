"use client";

// app_build/apps/web/src/app/loyalty-cards/add/page.tsx

import React from "react";
import { AddLoyaltyCardForm } from "../../../components/loyalty/AddLoyaltyCardForm";

export default function AddLoyaltyCardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Ajouter une nouvelle carte
      </h1>
      <AddLoyaltyCardForm />
    </div>
  );
}
