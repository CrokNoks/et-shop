"use client";

import React from 'react';

interface UserBadgeProps {
  initials: string;
  name: string;
  plan: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ initials, name, plan }) => {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className="w-10 h-10 rounded-full bg-[#1A365D] flex items-center justify-center text-white font-black text-sm">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1A365D] truncate">{name}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{plan}</p>
      </div>
    </div>
  );
};
