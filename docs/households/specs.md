# Spécifications techniques — Foyers & Authentification

## Stack

- Backend : NestJS 11, service pattern
- Frontend : Next.js 16, Client Components + Server Component layout
- Auth : Supabase Auth (JWT, email/password)
- Middleware : `src/middleware.ts` + `src/shared/lib/supabase/middleware.ts`

---

## Architecture

```
apps/api/src/households/
├── households.controller.ts
├── households.service.ts
└── households.module.ts

apps/web/src/
├── app/login/page.tsx              — Connexion email/password
├── app/household/setup/page.tsx    — Création du premier foyer
├── middleware.ts                   — Auth middleware (ne pas toucher)
└── shared/lib/supabase/middleware.ts — Helper Supabase SSR middleware
```

---

## API

```
GET    /households/me
  Auth: Bearer
  → Household[] (avec household_members imbriqués)

POST   /households
  Auth: Bearer
  Body: { name }
  → Household

GET    /households/:id/members
  Auth: Bearer
  → HouseholdMember[] (avec profil)

POST   /households/:id/members
  Auth: Bearer
  Body: { email }
  → { success: true } | 404 si utilisateur inconnu | 400 si déjà membre | 401 si non-admin

DELETE /households/:id/members/:userId
  Auth: Bearer
  → { success: true } | 401 si non-admin
```

---

## Modèle de données

### Table `households`

| Colonne | Type | Remarque |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | |
| `created_at` | TIMESTAMPTZ | |

> `owner_id` était prévu dans le schéma initial mais est géré via trigger (nullable en pratique).

### Table `household_members`

| Colonne | Type | Remarque |
|---|---|---|
| `household_id` | UUID FK → households | ON DELETE CASCADE |
| `user_id` | UUID FK → profiles | ON DELETE CASCADE |
| `role` | TEXT | `'admin'` ou `'member'` |
| PK | (household_id, user_id) | |

### Table `profiles`

Synchronisée automatiquement depuis `auth.users` via trigger `handle_new_user` (migration `20260323000000`). Contient `id`, `email`, `full_name`, `avatar_url`.

---

## Flux d'authentification

```
Login (email/password)
    ↓
Supabase Auth → JWT
    ↓
fetchApi("/households/me")
    ↓
households.length > 0 ?
    ├── oui → localStorage.setItem("active_household_id", households[0].id) → "/"
    └── non → "/household/setup"

Chaque requête API :
    ↓
Header Authorization: Bearer <token>
Header x-household-id: <active_household_id>
    ↓
SupabaseAuthGuard → valide le JWT, attach req.user
SupabaseService.getHouseholdId() → lit x-household-id
```

---

## Triggers SQL

| Trigger | Événement | Action |
|---|---|---|
| `handle_new_user` | AFTER INSERT ON auth.users | Crée le profil dans `profiles` |
| `handle_new_household` | BEFORE INSERT ON households | Définit `owner_id = auth.uid()` |
| `handle_new_household_membership` | AFTER INSERT ON households | Ajoute le créateur comme admin dans `household_members` |

---

## Configuration

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de l'instance Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (API NestJS) |
