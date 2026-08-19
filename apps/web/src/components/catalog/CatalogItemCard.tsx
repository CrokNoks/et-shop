"use client";

import React from "react";
import {
  QrCodeIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Checkbox } from "@/components/ui/checkbox";
import { CatalogItem } from "@/types";

interface CatalogItemCardProps {
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string, name: string) => void;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export const CatalogItemCard: React.FC<CatalogItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      data-cy={`catalog-item-${item.id}`}
      onClick={() => onEdit(item)}
      className={`flex cursor-pointer flex-col gap-3 rounded-[14px] border p-3.5 text-[var(--es-ink)] transition-colors ${
        isSelected
          ? "border-[#FF6B35] bg-[rgba(255,107,53,0.05)]"
          : "border-[var(--es-hairline)] bg-[var(--es-surface)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(checked as boolean)}
              className="h-[18px] w-[18px] border-[var(--es-hairline)] data-[state=checked]:bg-[#FF6B35] data-[state=checked]:border-[#FF6B35]"
            />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <span className="w-fit rounded-[6px] bg-[rgba(255,107,53,0.1)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c8471c]">
              {item.categories?.name || "Sans rayon"}
            </span>
            <h3 className="text-[15px] font-medium">{item.name}</h3>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => onEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
            title="Modifier"
          >
            <PencilIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id, item.name);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
            title="Supprimer"
          >
            <TrashIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="ml-8 flex items-center justify-between">
        <div className="flex flex-col gap-1 text-left">
          {item.barcode && (
            <div className="flex w-fit items-center gap-1.5 rounded-[8px] border border-[var(--es-hairline)] bg-[var(--es-field)] px-2 py-1 font-mono text-[12px] text-[var(--es-tertiary)]">
              <QrCodeIcon className="h-3.5 w-3.5" />
              {item.barcode}
            </div>
          )}
          {item.unit && (
            <span className="px-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--es-tertiary)]">
              Unité : {item.unit}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[var(--es-disabled)]">
          <TagIcon className="h-3.5 w-3.5" />
          <span className="text-[11.5px] font-semibold">
            {item.usage_count}
          </span>
        </div>
      </div>
    </div>
  );
};
