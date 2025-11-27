import withSerwist from "@serwist/next";
import type { NextConfig } from "next";
import { OFFLINE_ROUTES } from "@/config/offline-routes";

/**
 * 🎯 PAGES CRITIQUES À PRÉCACHER
 *
 * Ces pages seront téléchargées lors du premier chargement
 * et disponibles offline même si jamais visitées.
 *
 * ⚠️ IMPORTANT : Les routes sont maintenant centralisées dans src/config/offline-routes.ts
 * Ne plus modifier cette fonction, utiliser le fichier centralisé.
 */
const getCriticalPages = (): string[] => {
  return [...OFFLINE_ROUTES];
};

/**
 * 📊 Affiche les statistiques de précache au build
 */
const logPrecacheStats = () => {
  const pages = getCriticalPages();
  const uniquePages = [...new Set(pages)];

  console.log("\n" + "=".repeat(60));
  console.log("🎯 PWA PRECACHE CONFIGURATION");
  console.log("=".repeat(60));
  console.log(`📦 Pages critiques précachées : ${uniquePages.length}`);
  console.log(
    `📏 Taille estimée du cache    : ~${(uniquePages.length * 50) / 1024} MB`
  );
  console.log("=".repeat(60) + "\n");

  return uniquePages;
};

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
};

const serwistConfig = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: false,
  register: true,
  disable: process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ENABLE_PWA_DEV !== "true",

  additionalPrecacheEntries: [
    // Toutes les pages critiques (incluant /offline via OFFLINE_ROUTES)
    ...logPrecacheStats().map((url) => ({
      url,
      revision: `v2.0.4-${process.env.BUILD_ID || Date.now().toString()}`,
    })),
  ],
});

export default serwistConfig(nextConfig);
