/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist, type RuntimeCaching } from "@serwist/sw";
import { NetworkFirst } from "serwist";
import { OFFLINE_ROUTES } from "../config/offline-routes";

// Déclare que c'est un service worker pour TypeScript
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | PrecacheEntry)[];
};

/**
 * ✅ VERSION DU SERVICE WORKER
 * Incrémenter ce numéro force la mise à jour du cache
 */
const SW_VERSION = "v2.4.7";

/**
 * ✅ INSTALLATION DU SERVICE WORKER
 */
const manifest = self.__SW_MANIFEST;

// 🔍 DEBUG: Afficher le contenu du manifest pour voir ce qui est précaché
console.log(`[SW] 📦 Manifest contient ${manifest.length} entrées`);
console.log("[SW] 📋 Première entrée:", manifest[0]);
console.log("[SW] 📋 Dernière entrée:", manifest[manifest.length - 1]);

/**
 * ✅ STRATÉGIE DE CACHE POUR LES RSC PAYLOADS (React Server Components)
 *
 * Next.js fait des requêtes AJAX pour charger les données des pages (RSC payloads).
 * Ces requêtes ont un paramètre ?_rsc=... dans l'URL.
 *
 * Stratégie : NetworkFirst avec fallback intelligent
 * - En online : Réseau d'abord, puis cache
 * - En offline : Cherche dans le cache avec URL normalisée, sinon retourne réponse vide
 */
const rscCaching: RuntimeCaching = {
  matcher: ({ url }: { url: URL }) => {
    // Matcher les requêtes RSC (contiennent ?_rsc= dans l'URL)
    return url.searchParams.has("_rsc");
  },
  handler: new NetworkFirst({
    cacheName: "rsc-payloads",
    plugins: [
      {
        // Normaliser l'URL pour ignorer les query params lors du cache lookup
        cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
          const url = new URL(request.url);
          // Retirer TOUS les query params pour la clé de cache
          // Exemple: /actors/producer/create?entityId=xxx&_rsc=1ouku
          //       → /actors/producer/create
          url.search = "";
          return url.toString();
        },
      },
      {
        // En cas d'erreur réseau (offline), essayer de trouver le RSC payload en cache
        handlerDidError: async ({ request }: { request: Request }) => {
          const url = new URL(request.url);
          console.log("[SW] 🔄 RSC payload unavailable offline:", url.pathname);

          // Essayer de trouver le RSC payload exact en cache (avec la clé normalisée)
          const cacheKey = url.origin + url.pathname; // Sans query params
          const cache = await caches.open("rsc-payloads");
          const cachedRSC = await cache.match(cacheKey);

          if (cachedRSC) {
            console.log("[SW] ✅ RSC payload trouvé en cache:", cacheKey);
            return cachedRSC;
          }

          // ❌ Si pas de RSC en cache, retourner une erreur réseau (pas une réponse vide)
          // Cela force Next.js à faire une navigation complète (full page reload)
          // au lieu d'essayer de parser une réponse vide et afficher une page blanche
          console.log(
            "[SW] ⚠️ Pas de RSC payload en cache → Force navigation complète"
          );

          // Retourner une erreur réseau qui va déclencher le "Falling back to browser navigation"
          // AVANT que la page devienne blanche
          return Response.error();
        },
      },
    ],
  }),
};

/**
 * ✅ HANDLER PERSONNALISÉ POUR LES NAVIGATIONS
 *
 * Gère manuellement la logique NetworkFirst avec ignoreSearch pour un contrôle total
 */
class CustomNavigationHandler {
  async handle({ request }: { request: Request }): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const queryParams = url.search;

    console.log("[SW] 🔍 Navigation interceptée:", pathname + queryParams);
    console.log("[SW] 📶 Online:", navigator.onLine);

    // 1️⃣ Essayer le réseau en premier (NetworkFirst)
    try {
      console.log("[SW] 🌐 Tentative de chargement depuis le réseau...");
      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        console.log(
          "[SW] ✅ Page chargée depuis le réseau:",
          pathname + queryParams
        );

        // Mettre en cache la réponse (sans query params dans la clé)
        const cache = await caches.open("pages");
        await cache.put(pathname, networkResponse.clone());
        console.log("[SW] 💾 Page mise en cache:", pathname);

        return networkResponse;
      }
    } catch {
      console.log("[SW] ❌ Réseau inaccessible (offline ou erreur)");
    }

    // 2️⃣ Chercher dans le cache (sans query params)
    console.log("[SW] 🔎 Recherche dans le cache:", pathname);
    const cache = await caches.open("pages");
    const cachedResponse = await cache.match(pathname);

    if (cachedResponse) {
      console.log("[SW] ✅ Page trouvée en cache:", pathname);
      if (queryParams) {
        console.log("[SW] 📋 Query params ignorés:", queryParams);
      }
      return cachedResponse;
    }

    // 3️⃣ Fallback vers /offline
    console.log("[SW] ⚠️ Page introuvable en cache:", pathname);
    console.log("[SW] 📴 Fallback vers /offline");

    const offlinePage = await caches.match("/offline");
    return offlinePage || Response.error();
  }
}

/**
 * ✅ STRATÉGIE DE CACHE POUR LES NAVIGATIONS DE PAGES
 */
const navigationCaching: RuntimeCaching = {
  matcher: ({ request }) => request.mode === "navigate",
  handler: new CustomNavigationHandler(),
};

/**
 * ✅ STRATÉGIE DE CACHE POUR LES RESSOURCES STATIQUES
 *
 * Met en cache les fichiers JS, CSS, et autres assets de Next.js.
 * Utilise une stratégie NetworkFirst avec fallback sur le cache.
 * Si ni réseau ni cache, log l'erreur mais ne bloque pas.
 */
const staticAssetsCaching: RuntimeCaching = {
  matcher: ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  handler: new NetworkFirst({
    cacheName: "static-assets",
    networkTimeoutSeconds: 3,
    plugins: [
      {
        handlerDidError: async ({ request }) => {
          console.warn(
            `[SW] ⚠️ Chunk manquant (sera chargé au prochain online):`,
            request.url
          );
          // Retourner une réponse vide pour éviter le crash
          // Le chunk sera chargé automatiquement quand l'utilisateur sera online
          return new Response("", {
            status: 200,
            headers: { "Content-Type": "application/javascript" },
          });
        },
      },
    ],
  }),
};

installSerwist({
  precacheEntries: manifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    rscCaching, // ✅ Gestion des RSC payloads
    navigationCaching, // ✅ Gestion des navigations avec query params
    staticAssetsCaching, // <-- Stratégie ajoutée
    ...defaultCache,
  ],
});

/**
 * 📊 LOGS POUR DEBUGGING (Optionnel - retirer en production)
 */
self.addEventListener("install", (event) => {
  console.log(
    `[SW] 🎯 Service Worker ${SW_VERSION} installé avec ${manifest.length} entrées précachées`
  );

  // ✅ PRÉ-CHARGER les pages critiques (listings + formulaires) AVEC toutes leurs dépendances (JS, CSS)
  // ⚠️ IMPORTANT : Les routes sont maintenant centralisées dans src/config/offline-routes.ts
  const criticalDynamicPages = [...OFFLINE_ROUTES];

  event.waitUntil(
    (async () => {
      const cache = await caches.open("pages");
      console.log(
        `[SW] 📥 Pré-chargement de ${criticalDynamicPages.length} pages avec dépendances...`
      );

      let totalCached = 0;
      let alreadyCached = 0;

      for (const url of criticalDynamicPages) {
        try {
          // ✅ Vérifier si la page est déjà en cache
          const cachedPage = await cache.match(url);
          if (cachedPage) {
            alreadyCached++;
            continue; // Page déjà en cache, pas besoin de la recharger
          }

          // 1. Charger la page HTML
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[SW] ⚠️ Échec chargement page: ${url}`);
            continue;
          }

          const html = await response.text();
          await cache.put(
            url,
            new Response(html, {
              headers: response.headers,
            })
          );
          totalCached++;

          // 2. Extraire toutes les dépendances JS et CSS du HTML
          const scriptMatches = html.matchAll(/<script[^>]+src="([^"]+)"/g);
          const linkMatches = html.matchAll(
            /<link[^>]+href="([^"]+)"[^>]*rel="stylesheet"/g
          );

          const dependencies = [
            ...Array.from(scriptMatches).map((m) => m[1]),
            ...Array.from(linkMatches).map((m) => m[1]),
          ];

          console.log(
            `[SW] 📦 Page ${url}: ${dependencies.length} dépendances trouvées`
          );

          // 3. Mettre en cache toutes les dépendances en parallèle
          const depPromises = dependencies.map(async (dep) => {
            try {
              // Construire l'URL complète
              const depUrl = dep.startsWith("http")
                ? dep
                : new URL(dep, self.location.origin).toString();

              const depResponse = await fetch(depUrl);
              if (depResponse.ok) {
                await cache.put(depUrl, depResponse);
                totalCached++;
                return true;
              }
              return false;
            } catch {
              console.warn(`[SW] ⚠️ Échec cache dépendance: ${dep}`);
              return false;
            }
          });

          await Promise.all(depPromises);
          console.log(`[SW] ✅ Page + dépendances cachées: ${url}`);
        } catch (error) {
          console.error(`[SW] ❌ Erreur pré-chargement ${url}:`, error);
        }
      }

      console.log(
        `[SW] 🎉 Pré-chargement terminé! ${totalCached} nouvelles pages, ${alreadyCached} déjà en cache`
      );

      // Force le nouveau SW à prendre le contrôle immédiatement
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  console.log(`[SW] ✅ Service Worker ${SW_VERSION} activé`);

  // Nettoyer les anciens caches qui ne sont plus utilisés
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // ✅ Ne supprimer QUE les caches "pages" qui ne correspondent pas à la version actuelle
          // ⚠️ NE PAS supprimer les caches Serwist (serwist-precache-v...)
          if (
            cacheName.startsWith("pages-") &&
            !cacheName.includes(SW_VERSION)
          ) {
            console.log(`[SW] 🗑️ Suppression de l'ancien cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Prendre le contrôle immédiatement de tous les clients
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Log toutes les navigations pour debugging
  if (event.request.mode === "navigate") {
    const url = new URL(event.request.url);
    console.log(
      "[SW] 📡 Fetch intercepté (navigate):",
      url.pathname + url.search
    );
    console.log("[SW] 📡 Online:", navigator.onLine);

    // Test manuel du cache avec ignoreSearch pour diagnostiquer
    event.waitUntil(
      (async () => {
        const cache = await caches.open("pages");

        // Test 1: Match avec URL complète
        const matchWithQuery = await cache.match(event.request.url);
        console.log(
          "[SW] 🔍 Match avec query params:",
          matchWithQuery ? "✅ Trouvé" : "❌ Non trouvé"
        );

        // Test 2: Match avec pathname uniquement
        const matchWithoutQuery = await cache.match(url.pathname);
        console.log(
          "[SW] 🔍 Match sans query params:",
          matchWithoutQuery ? "✅ Trouvé" : "❌ Non trouvé"
        );

        // Test 3: Match avec ignoreSearch
        const matchIgnoreSearch = await cache.match(event.request.url, {
          ignoreSearch: true,
        });
        console.log(
          "[SW] 🔍 Match avec ignoreSearch:",
          matchIgnoreSearch ? "✅ Trouvé" : "❌ Non trouvé"
        );

        // Lister le contenu du cache pour ce pathname
        const keys = await cache.keys();
        const pageKeys = keys.filter(
          (req) => new URL(req.url).pathname === url.pathname
        );
        console.log(
          "[SW] 📦 URLs en cache pour",
          url.pathname + ":",
          pageKeys.map((k) => k.url)
        );
      })()
    );
  }
});
