"use client";

import React from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { AisleRef } from "@/hooks/useAisleMode";

interface AisleSelectorProps {
  aisles: AisleRef[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}

function isDone(aisle: AisleRef): boolean {
  return aisle.items.length > 0 && aisle.items.every((i) => i.is_purchased);
}

/**
 * Rangée horizontale de rayons, sélection libre (aucun ordre imposé). Le nom
 * du magasin n'apparaît que sur le premier rayon de chaque groupe — un filet
 * sépare les magasins entre eux.
 */
export const AisleSelector: React.FC<AisleSelectorProps> = ({
  aisles,
  activeKey,
  onSelect,
}) => {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto -mx-3.5 px-3.5 pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {aisles.map((aisle, index) => {
        const previous = aisles[index - 1];
        const isFirstOfStore = !previous || previous.storeId !== aisle.storeId;
        const active = aisle.key === activeKey;
        const done = isDone(aisle);
        const label = isFirstOfStore
          ? `${aisle.storeName} · ${aisle.categoryName} · ${aisle.items.length}`
          : aisle.categoryName;

        return (
          <React.Fragment key={aisle.key}>
            {isFirstOfStore && index > 0 && (
              <span className="w-px self-stretch bg-[var(--es-hairline)] shrink-0" />
            )}
            <button
              onClick={() => onSelect(aisle.key)}
              className={`shrink-0 h-8 px-3 rounded-2xl border text-[13px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                active
                  ? "border-[#FF6B35] bg-[#FF6B35]/8 dark:bg-[#FF6B35]/16 text-[#c8471c] dark:text-[#ffb694]"
                  : done
                    ? "border-[var(--es-hairline)] text-[var(--es-secondary)]"
                    : "border-[var(--es-hairline)] text-[var(--es-tertiary)]"
              }`}
            >
              {done && <CheckIcon className="w-3 h-3" strokeWidth={2.5} />}
              {label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
