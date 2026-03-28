"use client";

// app_build/apps/web/src/app/loyalty-cards/page.tsx

import React from "react";
import { LoyaltyCardList } from "../../components/loyalty/LoyaltyCardList";
import Link from "next/link";

export default function LoyaltyCardsPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Mes Cartes de Fidélité
        </h1>
        <Link
          href="/loyalty-cards/add"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Ajouter une carte
        </Link>
      </div>
      <LoyaltyCardList />
    </div>
  );
}
