"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCartIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = getSupabaseBrowserClient();

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
        const { fetchApi } = await import("@/lib/api");
        const households = await fetchApi("/households/me");

        if (households && households.length > 0) {
          localStorage.setItem("active_household_id", households[0].id);
          router.push("/");
        } else {
          router.push("/household/setup");
        }
      } catch {
        // Si le fetch échoue (ex: pas encore de foyer), on va sur setup
        router.push("/household/setup");
      }
      router.refresh();
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      // Si autoconfirm est activé, on redirige comme pour le login
      try {
        const { fetchApi } = await import("@/lib/api");
        const households = await fetchApi("/households/me");

        if (households && households.length > 0) {
          localStorage.setItem("active_household_id", households[0].id);
          router.push("/");
        } else {
          router.push("/household/setup");
        }
      } catch {
        router.push("/household/setup");
      }
      router.refresh();
    } else {
      toast.success("Vérifiez vos e-mails pour confirmer votre inscription !");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--es-bg)] flex flex-col items-center justify-center px-[18px] py-6 text-[var(--es-ink)]">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[var(--es-banner)]">
            <ShoppingCartIcon className="h-[17px] w-[17px] text-[#FF6B35]" />
          </div>
          <span className="text-[16px] font-semibold">Et SHop!</span>
        </div>

        <h1 className="text-[26px] font-semibold leading-tight">
          Connectez-vous
          <br />à votre foyer.
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--es-secondary)]">
              Email
            </label>
            <input
              type="email"
              data-cy="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-4 text-[15px] font-medium text-[var(--es-ink)] outline-none transition-colors focus:border-[#FF6B35]"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--es-secondary)]">
              Mot de passe
            </label>
            <input
              type="password"
              data-cy="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[50px] w-full rounded-[14px] border border-[var(--es-hairline)] bg-[var(--es-surface)] px-4 text-[15px] font-medium text-[var(--es-ink)] outline-none transition-colors focus:border-[#FF6B35]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p
              data-cy="login-error"
              className="px-1 text-center text-[13px] font-medium text-[var(--es-danger)]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            data-cy="login-submit"
            disabled={loading}
            className="mt-1 h-[50px] w-full rounded-[14px] bg-[var(--es-banner)] text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--es-hairline)]" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-tertiary)]">
            ou
          </span>
          <div className="h-px flex-1 bg-[var(--es-hairline)]" />
        </div>

        <button
          onClick={handleSignUp}
          data-cy="login-signup"
          disabled={loading}
          className="h-[50px] w-full rounded-[14px] border border-[#FF6B35] text-[15px] font-semibold text-[var(--es-accent-text)] transition-opacity disabled:opacity-50"
        >
          Créer un compte
        </button>

        <p className="text-center text-[11.5px] text-[var(--es-tertiary)]">
          Retrouvez vos listes de courses en famille, en temps réel.
        </p>
      </div>
    </div>
  );
}
