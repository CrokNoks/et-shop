// Service worker de l'app Et SHop!.
//
// Stratégies (cf. Technical_Specification.md, section "Nouveaux composants
// frontend" > public/sw.js) :
//   - cache-first sur l'app shell Next.js (`_next/static/**`) et les icônes
//     du manifest PWA (routes dynamiques `/pwa-icon-*`), avec une éviction
//     pragmatique par plafond pour ne pas grossir sans borne entre deux
//     montées manuelles de `CACHE_VERSION` (cf. avertissement H).
//   - network-first avec repli sur le shell de navigation précaché pour la
//     navigation racine UNIQUEMENT (`pathname === "/"`, cohérent avec
//     `start_url: "/"` du manifest PWA — l'app se relance toujours sur `/`).
//     Le shell est caché sous une clé fixe (`/`), donc ne doit JAMAIS être
//     alimenté ni servi pour une autre route : Next.js reconstruit l'arbre
//     de route depuis le payload RSC inliné dans le HTML de LA réponse
//     réellement servie, pas depuis `location` — servir le shell d'une
//     autre page sous l'URL `/` afficherait le contenu de cette autre page
//     (cf. revue Code Reviewer, correction bloquante #1). Toute navigation
//     directe hors ligne vers une autre route (`/lists`, `/loyalty-cards`,
//     etc.) échoue donc nativement, sans repli hors périmètre.
//   - AUCUNE interception des lectures API (`/shopping-lists/*`,
//     `/loyalty-cards*`, etc., et plus généralement tout ce qui n'est ni un
//     asset statique ni une navigation) : IndexedDB (`lib/offline/db.ts`)
//     reste l'UNIQUE source de vérité offline pour les données API. Un
//     cache HTTP par URL ici écraserait l'état optimiste et le cache
//     IndexedDB au refetch (le SW répondrait avec son propre snapshot
//     périmé sans jamais laisser `fetchApi` échouer) et pourrait, sur un
//     appareil partagé, fuiter les données d'un foyer vers un autre (pas de
//     purge au logout) — cf. revue Code Reviewer, corrections #1/#2.
//   - exclusion totale (aucune stratégie, jamais mis en cache) de `/login`
//     et de toute route d'authentification (Supabase inclus, même
//     cross-origin). Le middleware (`src/middleware.ts`) redirige toute
//     navigation sans session vers `/login`. Une requête de navigation
//     dispatchée au SW a `redirect: "manual"` : `fetch(request)` sur une
//     telle redirection renvoie une réponse opaque (`type: "opaqueredirect"`,
//     `ok: false`, `status: 0`) — c'est déjà `response.ok` qui bloque sa
//     mise en cache dans `navigateNetworkFirst`, `isAuthRoute`/
//     `dropRedirectFlag` n'y interviennent jamais en pratique. `fetch("/")`
//     dans `refreshNavigationShell`, en revanche, suit la redirection
//     normalement (`redirect: "follow"` par défaut) — c'est là que
//     `isAuthRoute`/`dropRedirectFlag` sont réellement la garde qui empêche
//     de précacher le HTML de `/login` sous la clé `/`.

const CACHE_VERSION = "v1";
const STATIC_CACHE = `et-shop-static-${CACHE_VERSION}`;
const NAV_CACHE = `et-shop-nav-${CACHE_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, NAV_CACHE];

// Plafond pragmatique du nombre d'entrées dans STATIC_CACHE (LRU approximatif
// par ordre d'insertion — la Cache Storage API ne trace pas nativement les
// accès). La seule invalidation complète reste la montée manuelle de
// `CACHE_VERSION` ; ce plafond borne juste la croissance entre deux montées
// (cf. avertissement H). Doit rester largement au-dessus de l'empreinte
// statique d'un seul build (~60 entrées au moment d'écrire ceci : chunks
// JS/CSS + polices + icônes PWA) : une éviction par ordre d'insertion
// retire en priorité le runtime webpack et les chunks framework partagés,
// dont TOUTES les pages dépendent — un plafond trop bas casse le cold start
// hors ligne que le précache est censé garantir (cf. revue Code Reviewer,
// correction bloquante). 300 laisse la marge de plusieurs builds successifs
// avant qu'une montée manuelle de `CACHE_VERSION` ne redevienne nécessaire.
const STATIC_CACHE_MAX_ENTRIES = 300;

// Clé fixe dans NAV_CACHE pour le shell de navigation précaché (route `/`
// uniquement, cf. en-tête de ce fichier).
const NAV_SHELL_KEY = "/";

const STATIC_ICON_PATHS = [
  "/pwa-icon-192",
  "/pwa-icon-512",
  "/pwa-icon-monochrome",
];

/**
 * Reconstruit une `Response` sans son flag interne "redirected". Nécessaire
 * avant tout `cache.put()` et avant tout retour via `respondWith()` pour une
 * requête de navigation : une `Response` avec `redirected: true` peut être
 * rejetée par le navigateur pour une requête dont le mode de redirection
 * n'est pas "follow" ("a redirected response was used for a request whose
 * redirect mode is not follow") — cf. revue Code Reviewer, correction
 * bloquante #2.
 */
async function dropRedirectFlag(response) {
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/**
 * (Re)précache le shell de navigation `/`. Appelé à l'installation et à
 * chaque activation pour ne jamais figer un shell obsolète après déploiement
 * (même `CACHE_VERSION`/nommage que le reste du fichier pour l'invalidation
 * globale des anciens caches à l'activation).
 */
async function refreshNavigationShell() {
  try {
    let response = await fetch(NAV_SHELL_KEY);
    if (!response || !response.ok) return;

    // Destination finale APRÈS suivi d'une éventuelle redirection (ex. pas
    // de session → `/login`) : capturée avant toute reconstruction, car une
    // `Response` reconstruite via le constructeur perd `response.url`.
    const finalUrl = new URL(response.url || NAV_SHELL_KEY, self.location.origin);
    if (isAuthRoute(finalUrl)) return; // jamais précacher /login sous la clé `/`

    if (response.redirected) response = await dropRedirectFlag(response);

    const cache = await caches.open(NAV_CACHE);
    await cache.put(NAV_SHELL_KEY, response.clone());
  } catch {
    // Pas de réseau à l'installation/activation : le shell précédemment
    // précaché (s'il existe) reste tel quel ; sinon le premier démarrage à
    // froid hors ligne restera indisponible — dégradation propre, pas de
    // crash du SW.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(refreshNavigationShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => refreshNavigationShell())
      .then(() => self.clients.claim()),
  );
});

function isAuthRoute(url) {
  if (url.pathname === "/login" || url.pathname.startsWith("/login/")) {
    return true;
  }
  if (url.pathname.includes("/auth/")) return true;
  if (
    url.hostname !== self.location.hostname &&
    url.hostname.includes("supabase")
  ) {
    return true;
  }
  return false;
}

function isStaticAsset(url) {
  if (url.hostname !== self.location.hostname) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  return STATIC_ICON_PATHS.includes(url.pathname);
}

/**
 * Éviction LRU approximative de `STATIC_CACHE` au-delà de
 * `STATIC_CACHE_MAX_ENTRIES` : `cache.keys()` renvoie l'ordre d'insertion,
 * qui approxime "plus ancien ajouté" — suffisant ici, pas besoin de
 * sophistication (cf. avertissement H). La seule invalidation complète
 * reste la montée manuelle de `CACHE_VERSION`.
 */
async function evictStaticCacheOverflow(cache) {
  const keys = await cache.keys();
  const overflow = keys.length - STATIC_CACHE_MAX_ENTRIES;
  for (let i = 0; i < overflow; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(event) {
  const { request } = event;
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    // Ne bloque pas la réponse sur l'écriture cache : le SW reste vivant
    // jusqu'à la fin du `put` grâce à `waitUntil`, et un échec d'écriture
    // (quota, etc.) est avalé sans faire échouer la requête.
    event.waitUntil(
      cache
        .put(request, response.clone())
        .then(() => evictStaticCacheOverflow(cache))
        .catch(() => {}),
    );
  }
  return response;
}

async function navigateNetworkFirst(event) {
  const { request } = event;
  const url = new URL(request.url);
  // Shell précaché = clé fixe `/` : ne jamais l'alimenter ni le servir pour
  // une autre route (cf. en-tête de ce fichier, correction bloquante #1).
  const isRootNav = url.pathname === "/";
  const cache = await caches.open(NAV_CACHE);
  try {
    let response = await fetch(request);

    // Destination finale APRÈS suivi d'une éventuelle redirection (ex. pas
    // de session → `/login`), capturée avant toute reconstruction de la
    // réponse (cf. correction bloquante #2).
    const finalUrl = new URL(response.url || request.url);
    const isLoginDestination = isAuthRoute(finalUrl);

    if (response.redirected) response = await dropRedirectFlag(response);

    if (isRootNav && response.ok && !isLoginDestination) {
      // Rafraîchit le shell à chaque navigation racine réussie (pas
      // seulement à l'installation/activation), toujours sous la clé fixe
      // `/`, jamais si la destination finale est `/login`.
      event.waitUntil(
        cache.put(NAV_SHELL_KEY, response.clone()).catch(() => {}),
      );
    }
    // La réponse (reconstruite si elle avait été redirigée) est toujours
    // retournée au navigateur, même si sa destination est `/login` : seule
    // la mise en cache est bloquée, la redirection doit s'afficher
    // normalement.
    return response;
  } catch (error) {
    if (isRootNav) {
      const cachedShell = await cache.match(NAV_SHELL_KEY);
      if (cachedShell) return cachedShell;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isAuthRoute(url)) return; // exclusion totale, aucune stratégie

  if (request.mode === "navigate") {
    event.respondWith(navigateNetworkFirst(event));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event));
    return;
  }

  // Tout le reste (dont toutes les lectures API) : comportement réseau
  // natif, jamais intercepté — cf. en-tête de ce fichier.
});
