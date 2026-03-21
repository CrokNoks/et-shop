"use client";

import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const CatalogSearch: React.FC<CatalogSearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative group max-w-md">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF6B35] transition-colors" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher par nom ou code-barres..."
        className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] shadow-sm text-[#1A365D] font-medium transition-all"
      />
    </div>
  );
};
