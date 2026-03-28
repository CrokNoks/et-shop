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
      className={`flex items-center gap-4 p-4 bg-white border rounded-2xl transition-colors ${
        isDragging
          ? "border-[#FF6B35] shadow-lg opacity-80"
          : "border-gray-100 hover:border-gray-200 shadow-sm"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-300 hover:text-gray-500 transition-colors"
      >
        <Bars3Icon className="w-6 h-6" />
      </div>

      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">{order.category?.icon || "📦"}</span>
        <span className="font-bold text-lg text-[#1A365D]">
          {order.category?.name}
        </span>
      </div>

      <div className="text-xs font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg">
        {order.sort_order}
      </div>
    </div>
  );
};
