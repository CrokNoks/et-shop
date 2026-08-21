"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bars3Icon,
  PencilIcon,
  TrashIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { Checkbox } from "@/components/ui/checkbox";
import { CatalogItem } from "@/types";

interface SortableCatalogItemProps {
  item: CatalogItem;
  /** Recherche active : le drag-and-drop est désactivé, la poignée est visuellement inactive. */
  dragDisabled?: boolean;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SortableCatalogItem: React.FC<SortableCatalogItemProps> = ({
  item,
  dragDisabled = false,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: dragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-cy={`catalog-item-${item.id}`}
      className={`flex items-center gap-2 rounded-[12px] border bg-[var(--es-surface)] px-2 py-2 text-[var(--es-ink)] transition-colors ${
        isSelected
          ? "border-[#FF6B35] bg-[rgba(255,107,53,0.05)]"
          : isDragging
            ? "border-[#FF6B35] bg-[rgba(255,107,53,0.05)] shadow-[0_6px_16px_rgba(18,36,63,0.1)]"
            : "border-[var(--es-hairline)]"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        aria-hidden={dragDisabled}
        className={`flex h-8 w-6 shrink-0 items-center justify-center text-[var(--es-disabled)] ${
          dragDisabled
            ? "cursor-not-allowed opacity-30"
            : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <Bars3Icon className="h-5 w-5" />
      </div>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked as boolean)}
          className="h-[18px] w-[18px] border-[var(--es-hairline)] data-[state=checked]:bg-[#FF6B35] data-[state=checked]:border-[#FF6B35]"
        />
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 py-1 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
          {item.name}
        </span>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-[var(--es-tertiary)]">
          {item.barcode && (
            <span className="flex items-center gap-1 rounded-[6px] border border-[var(--es-hairline)] bg-[var(--es-field)] px-1.5 py-0.5 font-mono">
              <QrCodeIcon className="h-3 w-3" />
              {item.barcode}
            </span>
          )}
          {item.unit && (
            <span className="uppercase tracking-wide">{item.unit}</span>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
          title="Modifier"
        >
          <PencilIcon className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--es-secondary)] hover:bg-[var(--es-field)]"
          title="Supprimer"
        >
          <TrashIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      {isDragging && (
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--es-accent-text)]">
          déplacé
        </span>
      )}
    </div>
  );
};
