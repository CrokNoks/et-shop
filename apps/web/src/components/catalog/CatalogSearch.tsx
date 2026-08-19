"use client";

import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const CatalogSearch: React.FC<CatalogSearchProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="group relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <MagnifyingGlassIcon className="h-4 w-4 text-[var(--es-tertiary)] transition-colors group-focus-within:text-[#FF6B35]" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher par nom ou code-barres..."
        className="h-11 w-full rounded-[12px] border border-[var(--es-hairline)] bg-[var(--es-surface)] pl-10 pr-3.5 text-[14px] font-medium text-[var(--es-ink)] outline-none focus:border-[#FF6B35]"
      />
    </div>
  );
};
