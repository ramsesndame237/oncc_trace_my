#!/usr/bin/env tsx
/**
 * Script de génération automatique des types depuis le backend
 *
 * Ce script lit les fichiers backend et génère les types TypeScript correspondants.
 *
 * Stratégie : Lecture directe du fichier backend (source unique de vérité)
 * - Développement local : lit depuis ../backend/app/types/user_roles.ts
 * - Docker build : lit depuis .backend-cache/user_roles.ts (copié par Dockerfile)
 *
 * Si le fichier est introuvable, le script échoue avec un message d'erreur clair.
 * Cela indique un problème de configuration à corriger.
 *
 * Usage: npm run generate:types
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
  "user_roles.ts"
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
  "user-roles.types.ts"
);

// Chemin pour le cache des fichiers backend (utilisé dans Docker)
const BACKEND_CACHE_DIR = path.join(FRONTEND_ROOT, ".backend-cache");
const BACKEND_CACHE_FILE = path.join(BACKEND_CACHE_DIR, "user_roles.ts");

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
interface RolesMetadata {
  roles: string[];
  names: Record<string, string>;
  namesFr: Record<string, string>;
  descriptions: Record<string, string>;
  descriptionsFr: Record<string, string>;
  rolePermissions?: Record<string, string[]>;
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
 * Source: backend/app/types/user_roles.ts (via API ou fichier)
 *
 * Pour modifier ces types, éditez le fichier source dans le backend
 * puis relancez: npm run generate:types
 *
 * Généré le: ${timestamp}
 */
`;
}


/**
 * Lit les métadonnées depuis le fichier backend
 */
function readRolesFromBackendFile(): RolesMetadata {
  let content = "";
  let sourcePath = "";

  // 1. Essayer d'abord depuis le backend root (développement local avec yarn dev)
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

  // Extraire les rôles depuis USER_ROLES
  const rolesMatch = content.match(
    /export const USER_ROLES = \[([\s\S]*?)\] as const/
  );
  if (!rolesMatch) {
    throw new Error(
      "❌ Impossible de trouver USER_ROLES dans le fichier backend"
    );
  }

  const rolesString = rolesMatch[1];
  const roles = rolesString
    .split(",")
    .map((r) => r.trim().replace(/['"`]/g, ""))
    .filter((r) => r.length > 0);

  // Extraire les noms courts EN
  const namesMatch = content.match(
    /export const USER_ROLE_NAMES: Record<UserRole, string> = \{([\s\S]*?)\}/
  );
  const names: Record<string, string> = {};

  if (namesMatch) {
    const namesString = namesMatch[1];
    const nameLines = namesString
      .split("\n")
      .filter((line) => line.includes(":"));

    nameLines.forEach((line) => {
      const match = line.match(/['"`]?(\w+)['"`]?\s*:\s*['"`](.*?)['"`]/);
      if (match) {
        names[match[1]] = match[2];
      }
    });
  }

  // Extraire les noms courts FR
  const namesFrMatch = content.match(
    /export const USER_ROLE_NAMES_FR: Record<UserRole, string> = \{([\s\S]*?)\}/
  );
  const namesFr: Record<string, string> = {};

  if (namesFrMatch) {
    const namesFrString = namesFrMatch[1];
    const nameLines = namesFrString
      .split("\n")
      .filter((line) => line.includes(":"));

    nameLines.forEach((line) => {
      // Regex pour capturer le contenu entre guillemets doubles ou simples
      const doubleQuoteMatch = line.match(/(\w+):\s*"([^"]+)"/);
      const singleQuoteMatch = line.match(/(\w+):\s*'([^']+)'/);
      const match = doubleQuoteMatch || singleQuoteMatch;

      if (match) {
        namesFr[match[1]] = match[2];
      }
    });
  }

  // Extraire les descriptions EN
  const descriptionsMatch = content.match(
    /export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = \{([\s\S]*?)\}/
  );
  const descriptions: Record<string, string> = {};

  if (descriptionsMatch) {
    const descriptionsString = descriptionsMatch[1];
    const descriptionLines = descriptionsString
      .split("\n")
      .filter((line) => line.includes(":"));

    descriptionLines.forEach((line) => {
      const match = line.match(/['"`]?(\w+)['"`]?\s*:\s*['"`](.*?)['"`]/);
      if (match) {
        descriptions[match[1]] = match[2];
      }
    });
  }

  // Extraire les descriptions FR depuis USER_ROLE_DESCRIPTIONS_FR
  const descriptionsFrMatch = content.match(
    /export const USER_ROLE_DESCRIPTIONS_FR: Record<UserRole, string> = \{([\s\S]*?)\n\}/
  );
  const descriptionsFr: Record<string, string> = {};

  if (descriptionsFrMatch) {
    const descriptionsFrString = descriptionsFrMatch[1];

    // Parser les descriptions en gérant les multi-lignes
    let currentKey = "";
    let currentValue = "";
    let inValue = false;

    descriptionsFrString.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === ",") return;

      // Nouvelle clé détectée
      if (trimmed.match(/^(\w+):/)) {
        // Sauvegarder la précédente si elle existe
        if (currentKey && currentValue) {
          descriptionsFr[currentKey] = currentValue.replace(/,\s*$/, "");
        }

        // Extraire la nouvelle clé et valeur
        const match = trimmed.match(/^(\w+):\s*['"`]?(.*?)['"`]?,?\s*$/);
        if (match) {
          currentKey = match[1];
          currentValue = match[2];
          inValue = !trimmed.includes(",") && !match[2]; // Si pas de virgule finale, la valeur continue
        }
      } else if (inValue && trimmed.startsWith("'")) {
        // Suite d'une valeur multi-ligne
        currentValue += " " + trimmed.replace(/^['"`]|['"`],?\s*$/g, "");
        inValue = !trimmed.includes(",");
      }
    });

    // Sauvegarder la dernière clé
    if (currentKey && currentValue) {
      descriptionsFr[currentKey] = currentValue.replace(/,\s*$/, "");
    }
  }

  // Si certains rôles n'ont pas de noms/descriptions, fallback
  roles.forEach((role) => {
    const fallbackName = role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    if (!names[role]) {
      names[role] = fallbackName;
    }
    if (!namesFr[role]) {
      namesFr[role] = fallbackName;
    }
    if (!descriptionsFr[role]) {
      descriptionsFr[role] = fallbackName;
    }
  });

  // Extraire les permissions de rôles depuis ROLE_PERMISSIONS
  const rolePermissionsMatch = content.match(
    /export const ROLE_PERMISSIONS: Record<UserRole, UserRole\[\]> = \{([\s\S]*?)\n\}/
  );
  const rolePermissions: Record<string, string[]> = {};

  if (rolePermissionsMatch) {
    const permissionsString = rolePermissionsMatch[1];
    let currentRole = "";
    let currentPermissions: string[] = [];
    let inArray = false;

    permissionsString.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === ",") return;

      // Nouvelle clé détectée (ex: super_admin:)
      if (trimmed.match(/^(\w+):/)) {
        // Sauvegarder la précédente si elle existe
        if (currentRole && currentPermissions.length > 0) {
          rolePermissions[currentRole] = currentPermissions;
        }

        // Extraire le nouveau rôle
        const roleMatch = trimmed.match(/^(\w+):/);
        if (roleMatch) {
          currentRole = roleMatch[1];
          currentPermissions = [];

          // Vérifier si c'est une référence à USER_ROLES_ARRAY ou un filtre
          if (trimmed.includes("USER_ROLES_ARRAY")) {
            if (trimmed.includes(".filter")) {
              // admin: USER_ROLES_ARRAY.filter((r) => r !== 'super_admin')
              currentPermissions = roles.filter((r) => r !== "super_admin");
            } else {
              // super_admin: USER_ROLES_ARRAY
              currentPermissions = [...roles];
            }
            inArray = false;
          } else if (trimmed.includes("[")) {
            // Début d'un tableau explicite
            inArray = true;
            const constMatch = trimmed.match(/USER_ROLES_CONSTANTS\.(\w+)/);
            if (constMatch) {
              currentPermissions.push(constMatch[1].toLowerCase());
            }
          } else if (trimmed.includes("[]")) {
            // Tableau vide
            currentPermissions = [];
            inArray = false;
          }
        }
      } else if (inArray && trimmed.includes("USER_ROLES_CONSTANTS")) {
        // Ligne dans un tableau (ex: USER_ROLES_CONSTANTS.TECHNICAL_VALIDATOR,)
        const constMatch = trimmed.match(/USER_ROLES_CONSTANTS\.(\w+)/);
        if (constMatch) {
          currentPermissions.push(constMatch[1].toLowerCase());
        }

        // Vérifier si le tableau se termine
        if (trimmed.includes("]")) {
          inArray = false;
        }
      }
    });

    // Sauvegarder le dernier rôle
    if (currentRole) {
      rolePermissions[currentRole] = currentPermissions;
    }
  }

  log(`✓ ${roles.length} rôle(s) extrait(s) du fichier backend`, colors.green);
  return {
    roles,
    names,
    namesFr,
    descriptions,
    descriptionsFr,
    rolePermissions,
  };
}

/**
 * Récupère les métadonnées des rôles depuis le fichier backend
 */
async function getRolesMetadata(): Promise<RolesMetadata> {
  return readRolesFromBackendFile();
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
function generateTypeScriptContent(metadata: RolesMetadata): string {
  const {
    roles,
    names,
    namesFr,
    descriptions,
    descriptionsFr,
    rolePermissions,
  } = metadata;
  const rolesArray = roles.map((r) => `'${r}'`).join(", ");
  const rolesUnion = roles.map((r) => `"${r}"`).join(" | ");

  let content = generateHeader();

  // Types de base
  content += `
// ============================================================================
// TYPES DE BASE
// ============================================================================

/**
 * Type union des rôles utilisateur disponibles
 */
export type UserRole = ${rolesUnion};

/**
 * Tableau constant des rôles (pour validation et itération)
 */
export const USER_ROLES = [${rolesArray}] as const;

/**
 * Type du tableau des rôles
 */
export type UserRoleArray = typeof USER_ROLES;

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Constantes pour les rôles (évite les erreurs de frappe)
 */
export const USER_ROLES_CONSTANTS = {
${roles
  .map((role) => `  ${role.toUpperCase()}: '${role}' as const,`)
  .join("\n")}
} as const;

/**
 * Array des rôles pour validation
 */
export const USER_ROLES_ARRAY: UserRole[] = [
${roles
  .map((role) => `  USER_ROLES_CONSTANTS.${role.toUpperCase()},`)
  .join("\n")}
];

// ============================================================================
// NOMS (COURTS)
// ============================================================================

/**
 * Noms courts des rôles en anglais
 */
export const USER_ROLE_NAMES: Record<UserRole, string> = {
${roles.map((role) => `  ${role}: '${escapeQuotes(names[role] || role)}',`).join("\n")}
};

/**
 * Noms courts des rôles en français
 */
export const USER_ROLE_NAMES_FR: Record<UserRole, string> = {
${roles.map((role) => `  ${role}: '${escapeQuotes(namesFr[role] || role)}',`).join("\n")}
};

// ============================================================================
// DESCRIPTIONS (LONGUES)
// ============================================================================

/**
 * Descriptions des rôles en anglais
 */
export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
${roles.map((role) => `  ${role}: '${escapeQuotes(descriptions[role] || role)}',`).join("\n")}
};

/**
 * Descriptions des rôles en français
 */
export const USER_ROLE_DESCRIPTIONS_FR: Record<UserRole, string> = {
${roles
  .map((role) => `  ${role}: '${escapeQuotes(descriptionsFr[role] || role)}',`)
  .join("\n")}
};

`;

  // Permissions de rôles
  if (rolePermissions) {
    content += `// ============================================================================
// PERMISSIONS DE RÔLES
// ============================================================================

/**
 * Définit les rôles qu'un utilisateur peut créer et consulter selon son propre rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, UserRole[]> = {
`;
    roles.forEach((role) => {
      const permissions = rolePermissions[role] || [];
      if (permissions.length === 0) {
        content += `  ${role}: [],\n`;
      } else {
        const permissionsStr = permissions.map((p) => `'${p}'`).join(", ");
        content += `  ${role}: [${permissionsStr}],\n`;
      }
    });

    content += `};

/**
 * Retourne les rôles autorisés pour un utilisateur donné
 */
export function getAuthorizedRoles(userRole: UserRole): UserRole[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

`;
  }

  // Helpers
  content += `// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifie si une valeur est un rôle valide
 */
export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && USER_ROLES_ARRAY.includes(role as UserRole);
}

/**
 * Récupère le nom court d'un rôle (français)
 */
export function getRoleName(role: UserRole): string {
  return USER_ROLE_NAMES_FR[role] || role;
}

/**
 * Récupère le nom court d'un rôle (anglais)
 */
export function getRoleNameEn(role: UserRole): string {
  return USER_ROLE_NAMES[role] || role;
}

/**
 * Récupère le nom d'affichage d'un rôle (français) - DEPRECATED: utiliser getRoleName
 * @deprecated Use getRoleName instead
 */
export function getRoleDisplayName(role: UserRole): string {
  return USER_ROLE_NAMES_FR[role] || role;
}

/**
 * Récupère la description complète d'un rôle (français)
 */
export function getRoleDescriptionFr(role: UserRole): string {
  return USER_ROLE_DESCRIPTIONS_FR[role] || role;
}

/**
 * Récupère la description complète d'un rôle (anglais)
 */
export function getRoleDescription(role: UserRole): string {
  return USER_ROLE_DESCRIPTIONS[role] || role;
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
      "\n🚀 Génération des types frontend depuis le backend...\n",
      colors.bright
    );

    // Récupérer les métadonnées
    const metadata = await getRolesMetadata();
    log(`✓ Métadonnées récupérées: ${metadata.roles.join(", ")}`, colors.green);

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
