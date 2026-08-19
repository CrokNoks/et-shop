import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { StoreCategoryOrder } from "@/types";

interface SortableCategoryItemProps {
  order: StoreCategoryOrder;
}

export const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({
  order,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.category_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex h-14 items-center gap-3 rounded-[12px] border bg-[var(--es-surface)] px-3 transition-colors ${
        isDragging
          ? "border-[#FF6B35] bg-[rgba(255,107,53,0.05)] shadow-[0_6px_16px_rgba(18,36,63,0.1)]"
          : "border-[var(--es-hairline)]"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-[var(--es-disabled)] active:cursor-grabbing"
      >
        <Bars3Icon className="h-5 w-5" />
      </div>

      <span className="w-5 shrink-0 text-[12.5px] tabular-nums text-[var(--es-tertiary)]">
        {order.sort_order}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-lg">{order.category?.icon || "📦"}</span>
        <span className="truncate text-[15px] font-medium text-[var(--es-ink)]">
          {order.category?.name}
        </span>
      </div>

      {isDragging && (
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--es-accent-text)]">
          déplacé
        </span>
      )}
    </div>
  );
};
