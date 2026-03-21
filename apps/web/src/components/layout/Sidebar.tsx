"use client";

import React, { useState } from 'react';
import { SidebarContent } from './SidebarContent';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bars3Icon } from '@heroicons/react/24/outline';

interface SidebarProps {
  activeListId: string;
  onListSelect: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeListId, onListSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex w-80 bg-white border-r border-gray-100 p-8 flex-col gap-8 h-screen sticky top-0 overflow-y-auto">
        <SidebarContent activeListId={activeListId} onListSelect={onListSelect} />
      </aside>

      {/* Mobile Menu Trigger (Hamburger) */}
      <div className="sm:hidden fixed top-6 left-6 z-[60]">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="p-3 bg-[#1A365D] text-white rounded-2xl shadow-lg active:scale-95 transition-all">
              <Bars3Icon className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-8 border-none text-[#1A365D]">
            <SidebarContent 
              activeListId={activeListId} 
              onListSelect={onListSelect} 
              onClose={() => setIsOpen(false)} 
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
