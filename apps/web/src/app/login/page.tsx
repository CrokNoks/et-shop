"use client";

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/layout/Logo';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      try {
        // Redirection intelligente : on vérifie si l'utilisateur a des foyers
        const { fetchApi } = await import('@/lib/api');
        const households = await fetchApi('/households/me');
        
        if (households && households.length > 0) {
          localStorage.setItem('active_household_id', households[0].id);
          router.push('/');
        } else {
          router.push('/household/setup');
        }
      } catch (err) {
        // Si le fetch échoue (ex: pas encore de foyer), on va sur setup
        router.push('/household/setup');
      }
      router.refresh();
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      toast.success('Vérifiez vos e-mails pour confirmer votre inscription !');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-[#1A365D]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <Logo width={200} height={60} />
          <h1 className="text-xl font-bold">Connectez-vous à Et SHop!</h1>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-[#FF6B35] font-medium transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center px-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-black text-lg shadow-lg hover:bg-[#e55a2b] disabled:opacity-50 transition-all"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <span className="text-xs font-bold text-gray-300 uppercase">ou</span>
            <div className="h-[1px] flex-1 bg-gray-100" />
          </div>

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-4 bg-white text-[#1A365D] border-2 border-gray-100 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all"
          >
            Créer un compte rapide
          </button>
        </div>
      </div>
    </div>
  );
}
