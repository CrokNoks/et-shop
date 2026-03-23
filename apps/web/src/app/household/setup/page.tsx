"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function HouseholdSetupPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkHouseholds() {
      try {
        const myHouseholds = await fetchApi('/households/me');
        if (myHouseholds && myHouseholds.length > 0) {
          localStorage.setItem('active_household_id', myHouseholds[0].id);
          router.push('/');
        } else {
          setChecking(false);
        }
      } catch (error: any) {
        console.error('Failed to check households:', error);
        // Si l'erreur est liée à l'auth, on redirige vers login
        if (error.message?.includes('auth') || error.status === 401) {
          router.push('/login');
        } else {
          setChecking(false);
        }
      }
    }
    checkHouseholds();
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const household = await fetchApi('/households', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      localStorage.setItem('active_household_id', household.id);
      router.push('/');
      toast.success("Foyer créé avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la création du foyer.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center text-[#1A365D]">
      <p className="animate-pulse font-bold">Vérification de votre foyer...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-[#1A365D]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <Logo width={200} height={60} />
          <h1 className="text-2xl font-black text-center">Bienvenue !</h1>
          <p className="text-gray-500 text-center text-sm">
            Pour commencer à utiliser Et SHop!, vous devez créer un foyer (ex: "Ma Famille", "Coloc"). 
            Vous pourrez ensuite y inviter des membres.
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label htmlFor="h-name" className="text-xs font-black text-gray-400 uppercase tracking-widest">Nom de votre foyer</Label>
            <Input 
              id="h-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Famille Dupont"
              className="text-lg font-bold border-gray-200 focus-visible:ring-[#FF6B35]"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold text-lg py-6 rounded-xl">
            {loading ? 'Création...' : 'Créer mon foyer 🚀'}
          </Button>
        </form>
      </div>
    </div>
  );
}
