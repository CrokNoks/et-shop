"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBagIcon, BookOpenIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { ShoppingBagIcon as ShoppingBagSolidIcon, BookOpenIcon as BookOpenSolidIcon, Squares2X2Icon as Squares2X2SolidIcon } from '@heroicons/react/24/solid';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Courses', href: '/', icon: ShoppingBagIcon, activeIcon: ShoppingBagSolidIcon },
    { name: 'Catalogue', href: '/catalog', icon: BookOpenIcon, activeIcon: BookOpenSolidIcon },
    { name: 'Rayons', href: '/categories', icon: Squares2X2Icon, activeIcon: Squares2X2SolidIcon },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-8 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = isActive ? item.activeIcon : item.icon;
        
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#FF6B35]' : 'text-gray-400 hover:text-[#1A365D]'}`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};
