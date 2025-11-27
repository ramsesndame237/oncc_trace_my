#!/usr/bin/env tsx
/**
 * Script de génération automatique des types cacao depuis le backend
 *
 * Ce script lit les fichiers backend et génère les types TypeScript correspondants
 * pour les qualités et standards de cacao.
 *
 * Stratégie : Lecture directe du fichier backend (source unique de vérité)
 * - Développement local : lit depuis ../backend/app/types/cacao_types.ts
 * - Docker build : lit depuis .backend-cache/cacao_types.ts (copié par Dockerfile)
 *
 * Si le fichier est introuvable, le script échoue avec un message d'erreur clair.
 * Cela indique un problème de configuration à corriger.
 *
 * Usage: npm run generate:types:cacao
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins
const FRONTEND_ROOT = path.resolve(__dirname, "..");
const BACKEND_ROOT = path.resolve(FRONTEND_ROOT, "..", "backend");
const BACKEND_TYPES_PATH = path.join(
  BACKEND_ROOT,
  "app",
  "types",
  "cacao_types.ts"
);
const FRONTEND_GENERATED_DIR = path.join(
  FRONTEND_ROOT,
  "src",
  "core",
  "domain",
  "generated"
);
const FRONTEND_OUTPUT_PATH = path.join(
  FRONTEND_GENERATED_DIR,
  "cacao-types.types.ts"
);

// Chemin pour le cache des fichiers backend (utilisé dans Docker)
const BACKEND_CACHE_DIR = path.join(FRONTEND_ROOT, ".backend-cache");
const BACKEND_CACHE_FILE = path.join(BACKEND_CACHE_DIR, "cacao_types.ts");

// Couleurs pour les logs
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Types
interface CacaoMetadata {
  qualities: string[];
  standards: string[];
  qualityLabels: Record<string, string>;
  standardLabels: Record<string, string>;
}

/**
 * Génère le header du fichier TypeScript
 */
function generateHeader(): string {
  const timestamp = new Date().toISOString();
  return `/**
 * ⚠️  FICHIER GÉNÉRÉ AUTOMATIQUEMENT - NE PAS MODIFIER MANUELLEMENT
 *
 * Ce fichier est généré automatiquement depuis le backend.
 * Source: backend/app/types/cacao_types.ts (via fichier)
 *
 * Pour modifier ces types, éditez le fichier source dans le backend
 * puis relancez: npm run generate:types:cacao
 *
 * Généré le: ${timestamp}
 */
`;
}

/**
 * Lit les métadonnées depuis le fichier backend
 */
function readCacaoFromBackendFile(): CacaoMetadata {
  let content = "";
  let sourcePath = "";

  // 1. Essayer d'abord depuis le backend root (développement local)
  if (fs.existsSync(BACKEND_TYPES_PATH)) {
    sourcePath = BACKEND_TYPES_PATH;
    log(
      `📂 Mode développement : lecture depuis ${BACKEND_TYPES_PATH}`,
      colors.blue
    );
  }
  // 2. Sinon utiliser le cache Docker (.backend-cache copié par Dockerfile)
  else if (fs.existsSync(BACKEND_CACHE_FILE)) {
    sourcePath = BACKEND_CACHE_FILE;
    log(
      `🐳 Mode Docker : lecture depuis ${BACKEND_CACHE_FILE}`,
      colors.blue
    );
  }
  // 3. Aucune source disponible
  else {
    throw new Error(
      `❌ Fichier backend introuvable dans les deux emplacements:\n` +
      `  - Développement : ${BACKEND_TYPES_PATH}\n` +
      `  - Docker : ${BACKEND_CACHE_FILE}\n` +
      `\nAssurez-vous que le backend existe ou que Docker a copié les fichiers.`
    );
  }

  content = fs.readFileSync(sourcePath, "utf-8");

  // Extraire les qualités depuis PRODUCT_QUALITIES
  const qualitiesMatch = content.match(
    /export const PRODUCT_QUALITIES = \[([\s\S]*?)\] as const/
  );
  if (!qualitiesMatch) {
    throw new Error(
      "❌ Impossible de trouver PRODUCT_QUALITIES dans le fichier backend"
    );
  }

  const qualitiesString = qualitiesMatch[1];
  const qualities = qualitiesString
    .split(",")
    .map((q) => q.trim().replace(/['"`]/g, ""))
    .filter((q) => q.length > 0);

  // Extraire les standards depuis PRODUCT_STANDARDS
  const standardsMatch = content.match(
    /export const PRODUCT_STANDARDS = \[([\s\S]*?)\] as const/
  );
  if (!standardsMatch) {
    throw new Error(
      "❌ Impossible de trouver PRODUCT_STANDARDS dans le fichier backend"
    );
  }

  const standardsString = standardsMatch[1];
  const standards = standardsString
    .split(",")
    .map((s) => s.trim().replace(/['"`]/g, ""))
    .filter((s) => s.length > 0);

  // Extraire les labels de qualités depuis PRODUCT_QUALITY_LABELS
  const qualityLabelsMatch = content.match(
    /export const PRODUCT_QUALITY_LABELS: Record<ProductQuality, string> = \{([\s\S]*?)\}/
  );
  const qualityLabels: Record<string, string> = {};

  if (qualityLabelsMatch) {
    const labelsString = qualityLabelsMatch[1];
    const labelLines = labelsString
      .split("\n")
      .filter((line) => line.includes(":"));

    labelLines.forEach((line) => {
      const match = line.match(/['"`]?(\w+)['"`]?\s*:\s*['"`](.*?)['"`]/);
      if (match) {
        qualityLabels[match[1]] = match[2];
      }
    });
  }

  // Extraire les labels de standards depuis PRODUCT_STANDARD_LABELS
  const standardLabelsMatch = content.match(
    /export const PRODUCT_STANDARD_LABELS: Record<ProductStandard, string> = \{([\s\S]*?)\}/
  );
  const standardLabels: Record<string, string> = {};

  if (standardLabelsMatch) {
    const labelsString = standardLabelsMatch[1];
    const labelLines = labelsString
      .split("\n")
      .filter((line) => line.includes(":"));

    labelLines.forEach((line) => {
      const match = line.match(/['"`]?(\w+)['"`]?\s*:\s*['"`](.*?)['"`]/);
      if (match) {
        standardLabels[match[1]] = match[2];
      }
    });
  }

  log(
    `✓ ${qualities.length} qualité(s) et ${standards.length} standard(s) extrait(s) du fichier backend`,
    colors.green
  );
  return { qualities, standards, qualityLabels, standardLabels };
}

/**
 * Récupère les métadonnées des types cacao depuis le fichier backend
 */
async function getCacaoMetadata(): Promise<CacaoMetadata> {
  return readCacaoFromBackendFile();
}

/**
 * Échappe les apostrophes dans une chaîne pour l'utilisation dans du code JS/TS
 */
function escapeQuotes(str: string): string {
  return str.replace(/'/g, "\\'");
}

/**
 * Génère le contenu du fichier TypeScript
 */
function generateTypeScriptContent(metadata: CacaoMetadata): string {
  const { qualities, standards, qualityLabels, standardLabels } = metadata;

  const qualitiesArray = qualities.map((q) => `'${q}'`).join(", ");
  const qualitiesUnion = qualities.map((q) => `"${q}"`).join(" | ");

  const standardsArray = standards.map((s) => `'${s}'`).join(", ");
  const standardsUnion = standards.map((s) => `"${s}"`).join(" | ");

  let content = generateHeader();

  content += `
// ============================================================================
// QUALITÉS DE CACAO
// ============================================================================

/**
 * Type union des qualités de cacao disponibles
 */
export type ProductQuality = ${qualitiesUnion};

/**
 * Tableau constant des qualités (pour validation et itération)
 */
export const PRODUCT_QUALITIES = [${qualitiesArray}] as const;

/**
 * Type du tableau des qualités
 */
export type ProductQualityArray = typeof PRODUCT_QUALITIES;

/**
 * Constantes pour les qualités (évite les erreurs de frappe)
 */
export const PRODUCT_QUALITIES_CONSTANTS = {
${qualities
  .map((quality) => {
    const constantName = quality.toUpperCase();
    return `  ${constantName}: '${quality}' as const,`;
  })
  .join("\n")}
} as const;

/**
 * Array des qualités pour validation
 */
export const PRODUCT_QUALITIES_ARRAY: ProductQuality[] = [
${qualities
  .map((quality) => {
    const constantName = quality.toUpperCase();
    return `  PRODUCT_QUALITIES_CONSTANTS.${constantName},`;
  })
  .join("\n")}
];

/**
 * Labels d'affichage pour les qualités (français)
 */
export const PRODUCT_QUALITY_LABELS: Record<ProductQuality, string> = {
${qualities
  .map((quality) => {
    const label = qualityLabels[quality] || quality;
    return `  ${quality}: '${escapeQuotes(label)}',`;
  })
  .join("\n")}
};

// ============================================================================
// STANDARDS DE CACAO
// ============================================================================

/**
 * Type union des standards de cacao disponibles
 */
export type ProductStandard = ${standardsUnion};

/**
 * Tableau constant des standards (pour validation et itération)
 */
export const PRODUCT_STANDARDS = [${standardsArray}] as const;

/**
 * Type du tableau des standards
 */
export type ProductStandardArray = typeof PRODUCT_STANDARDS;

/**
 * Constantes pour les standards (évite les erreurs de frappe)
 */
export const PRODUCT_STANDARDS_CONSTANTS = {
${standards
  .map((standard) => `  ${standard.toUpperCase()}: '${standard}' as const,`)
  .join("\n")}
} as const;

/**
 * Array des standards pour validation
 */
export const PRODUCT_STANDARDS_ARRAY: ProductStandard[] = [
${standards
  .map((standard) => `  PRODUCT_STANDARDS_CONSTANTS.${standard.toUpperCase()},`)
  .join("\n")}
];

/**
 * Labels d'affichage pour les standards (français)
 */
export const PRODUCT_STANDARD_LABELS: Record<ProductStandard, string> = {
${standards
  .map((standard) => {
    const label = standardLabels[standard] || standard;
    return `  ${standard}: '${escapeQuotes(label)}',`;
  })
  .join("\n")}
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifie si une valeur est une qualité valide
 */
export function isValidQuality(quality: unknown): quality is ProductQuality {
  return typeof quality === 'string' && PRODUCT_QUALITIES_ARRAY.includes(quality as ProductQuality);
}

/**
 * Vérifie si une valeur est un standard valide
 */
export function isValidStandard(standard: unknown): standard is ProductStandard {
  return typeof standard === 'string' && PRODUCT_STANDARDS_ARRAY.includes(standard as ProductStandard);
}

/**
 * Récupère le label d'affichage d'une qualité
 */
export function getQualityLabel(quality: ProductQuality): string {
  return PRODUCT_QUALITY_LABELS[quality] || quality;
}

/**
 * Récupère le label d'affichage d'un standard
 */
export function getStandardLabel(standard: ProductStandard): string {
  return PRODUCT_STANDARD_LABELS[standard] || standard;
}
`;

  return content;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    log(
      "\n🚀 Génération des types cacao frontend depuis le backend...\n",
      colors.bright
    );

    // Récupérer les métadonnées
    const metadata = await getCacaoMetadata();
    log(
      `✓ Métadonnées récupérées: ${metadata.qualities.length} qualités, ${metadata.standards.length} standards`,
      colors.green
    );

    // Créer le dossier de destination
    if (!fs.existsSync(FRONTEND_GENERATED_DIR)) {
      fs.mkdirSync(FRONTEND_GENERATED_DIR, { recursive: true });
      log(`✓ Dossier créé: ${FRONTEND_GENERATED_DIR}`, colors.green);
    }

    // Générer le contenu TypeScript
    log("⚙️  Génération du contenu TypeScript...", colors.blue);
    const content = generateTypeScriptContent(metadata);

    // Écrire le fichier
    fs.writeFileSync(FRONTEND_OUTPUT_PATH, content, "utf-8");
    log(`✓ Fichier généré: ${FRONTEND_OUTPUT_PATH}`, colors.green);

    // Créer .gitignore si nécessaire
    const gitignorePath = path.join(FRONTEND_GENERATED_DIR, ".gitignore");
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(
        gitignorePath,
        "# Fichiers générés automatiquement\n*.types.ts\n",
        "utf-8"
      );
      log(`✓ .gitignore créé`, colors.green);
    }

    log(
      "\n✅ Génération terminée avec succès!\n",
      colors.bright + colors.green
    );
  } catch (error: any) {
    log(`\n❌ Erreur lors de la génération: ${error.message}\n`, colors.red);
    process.exit(1);
  }
}

// Exécution
main();
