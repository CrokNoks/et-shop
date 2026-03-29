"use client";

import React from "react";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import { useSupabase } from "@/hooks/useSupabase";
import { useRouter } from "next/navigation";

interface UserBadgeProps {
  initials: string;
  name: string;
  plan: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  initials,
  name,
  plan,
}) => {
  const supabase = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("active_household_id");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1A365D] flex items-center justify-center text-white font-black text-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A365D] truncate">{name}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {plan}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        data-cy="logout-button"
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        title="Se déconnecter"
      >
        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
