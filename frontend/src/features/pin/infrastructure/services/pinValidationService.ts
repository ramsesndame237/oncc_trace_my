import { PIN_CONFIG } from "../config/pinConfig";

/**
 * Vérifie si un PIN contient des chiffres séquentiels croissants
 * @param pin Le code PIN à vérifier
 * @returns true si le PIN contient une séquence croissante, false sinon
 */
export const isSequentialAscending = (pin: string): boolean => {
  if (pin.length < 3) return false;

  const digits = pin.split("").map((i) => Number(i));

  for (let i = 0; i < digits.length - 2; i++) {
    if (
      digits[i] + 1 === digits[i + 1] &&
      digits[i + 1] + 1 === digits[i + 2]
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Vérifie si un PIN contient des chiffres séquentiels décroissants
 * @param pin Le code PIN à vérifier
 * @returns true si le PIN contient une séquence décroissante, false sinon
 */
export const isSequentialDescending = (pin: string): boolean => {
  if (pin.length < 3) return false;

  const digits = pin.split("").map((i) => Number(i));

  for (let i = 0; i < digits.length - 2; i++) {
    if (
      digits[i] - 1 === digits[i + 1] &&
      digits[i + 1] - 1 === digits[i + 2]
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Vérifie si tous les chiffres d'un PIN sont identiques
 * @param pin Le code PIN à vérifier
 * @returns true si tous les chiffres sont identiques, false sinon
 */
export const hasRepeatingDigits = (pin: string): boolean => {
  return new Set(pin).size === 1;
};

/**
 * Vérifie si un PIN contient une séquence connue faible
 * @param pin Le code PIN à vérifier
 * @returns true si le PIN contient une séquence connue, false sinon
 */
export const containsKnownSequence = (pin: string): boolean => {
  const knownSequences = [
    "0123",
    "1234",
    "2345",
    "3456",
    "4567",
    "5678",
    "6789",
    "9876",
    "8765",
    "7654",
    "6543",
    "5432",
    "4321",
    "3210",
    "0000",
    "1111",
    "2222",
    "3333",
    "4444",
    "5555",
    "6666",
    "7777",
    "8888",
    "9999",
    // Séquences communes pour codes plus longs
    "01234",
    "12345",
    "23456",
    "34567",
    "45678",
    "56789",
    "98765",
    "87654",
    "76543",
    "65432",
    "54321",
    "43210",
    "00000",
    "11111",
    "22222",
    "33333",
    "44444",
    "55555",
    "66666",
    "77777",
    "88888",
    "99999",
    // Patterns courants
    "123456",
    "654321",
    "000000",
    "111111",
    "222222",
    "333333",
    "444444",
    "555555",
    "666666",
    "777777",
    "888888",
    "999999",
    "1234567",
    "7654321",
    "0000000",
    "1111111",
    "12345678",
    "87654321",
    "00000000",
    "11111111",
  ];

  return knownSequences.some((seq) => pin.includes(seq) || seq.includes(pin));
};

/**
 * Vérifie si un PIN contient des patterns de date communs
 * @param pin Le code PIN à vérifier
 * @returns true si le PIN ressemble à une date, false sinon
 */
export const containsDatePattern = (pin: string): boolean => {
  if (pin.length < 4) return false;

  // Patterns de date courants (MMJJ, JJMM, années)
  const datePatterns = [
    /^(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/, // MMJJ
    /^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])$/, // JJMM
    /^19\d{2}$/, // 19XX
    /^20\d{2}$/, // 20XX
    /^(0[1-9]|1[0-2])\d{2}$/, // MXX
  ];

  return datePatterns.some((pattern) => pattern.test(pin));
};

export type PinValidationResult = {
  isValid: boolean;
  score: number; // Score de sécurité de 0 à 100
  errors: {
    invalidLength?: boolean;
    notNumeric?: boolean;
    hasRepeatingDigits?: boolean;
    isSequential?: boolean;
    isKnownSequence?: boolean;
    containsDatePattern?: boolean;
    tooShort?: boolean;
    tooLong?: boolean;
  };
  suggestions?: string[];
};

/**
 * Service de validation des codes PIN
 */
export class PinValidationService {
  /**
   * Valide un code PIN selon la configuration et les critères de sécurité
   * @param pin Le code PIN à valider
   * @param options Options de validation personnalisées
   * @returns Résultat détaillé de la validation
   */
  static validatePin(
    pin: string,
    options: {
      length?: number;
      checkRepeatingDigits?: boolean;
      checkSequential?: boolean;
      checkKnownSequences?: boolean;
      checkDatePatterns?: boolean;
      strictMode?: boolean;
    } = {}
  ): PinValidationResult {
    const {
      length = PIN_CONFIG.security.pinLength,
      checkRepeatingDigits = true,
      checkSequential = true,
      checkKnownSequences = true,
      checkDatePatterns = false,
      strictMode = false,
    } = options;

    const errors: PinValidationResult["errors"] = {};
    const suggestions: string[] = [];
    let score = 100;

    // Vérification de base : longueur
    if (pin.length < length) {
      errors.tooShort = true;
      errors.invalidLength = true;
      suggestions.push(
        `Le code PIN doit contenir exactement ${length} chiffres`
      );
      score -= 30;
    }

    if (pin.length > length) {
      errors.tooLong = true;
      errors.invalidLength = true;
      suggestions.push(
        `Le code PIN doit contenir exactement ${length} chiffres`
      );
      score -= 20;
    }

    // Vérification : caractères numériques uniquement
    if (!/^\d+$/.test(pin)) {
      errors.notNumeric = true;
      suggestions.push("Le code PIN ne doit contenir que des chiffres");
      score -= 40;
    }

    // Si erreurs de base, arrêter la validation
    if (errors.invalidLength || errors.notNumeric) {
      return {
        isValid: false,
        score: Math.max(0, score),
        errors,
        suggestions,
      };
    }

    // Vérifications de sécurité avancées
    if (checkRepeatingDigits && hasRepeatingDigits(pin)) {
      errors.hasRepeatingDigits = true;
      suggestions.push("Évitez d'utiliser le même chiffre répété");
      score -= 25;
    }

    if (
      checkSequential &&
      (isSequentialAscending(pin) || isSequentialDescending(pin))
    ) {
      errors.isSequential = true;
      suggestions.push("Évitez les séquences de chiffres consécutifs");
      score -= 20;
    }

    if (checkKnownSequences && containsKnownSequence(pin)) {
      errors.isKnownSequence = true;
      suggestions.push(
        "Ce code PIN est trop prévisible, choisissez une combinaison plus unique"
      );
      score -= 30;
    }

    if (checkDatePatterns && containsDatePattern(pin)) {
      errors.containsDatePattern = true;
      suggestions.push("Évitez d'utiliser des dates comme code PIN");
      score -= 15;
    }

    // Pas de bonus pour longueur différente - on veut une longueur exacte

    // En mode strict, certaines erreurs sont rédhibitoires
    const hasBlockingErrors =
      strictMode &&
      (errors.hasRepeatingDigits ||
        errors.isSequential ||
        errors.isKnownSequence);

    const isValid = Object.keys(errors).length === 0 && !hasBlockingErrors;

    return {
      isValid,
      score: Math.max(0, Math.min(100, score)),
      errors,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * Validation simple pour compatibilité avec l'ancien code
   * @param pin Le code PIN à valider
   * @param options Options de validation
   * @returns true si valide, false sinon
   */
  static isValidPin(
    pin: string,
    options: {
      length?: number;
      checkRepeatingDigits?: boolean;
      checkSequential?: boolean;
      checkKnownSequences?: boolean;
    } = {}
  ): boolean {
    const {
      length,
      checkRepeatingDigits = true,
      checkSequential = true,
      checkKnownSequences = true,
    } = options;

    const result = this.validatePin(pin, {
      length: length || PIN_CONFIG.security.pinLength,
      checkRepeatingDigits,
      checkSequential,
      checkKnownSequences,
      strictMode: true,
    });

    // Si une longueur spécifique est demandée, vérifier exactement
    if (length && pin.length !== length) {
      return false;
    }

    return result.isValid;
  }

  /**
   * Génère des suggestions pour améliorer un code PIN
   * @param pin Le code PIN à analyser
   * @returns Liste de suggestions
   */
  static getSuggestions(pin: string): string[] {
    const result = this.validatePin(pin);
    const suggestions = result.suggestions || [];

    if (result.score < 70) {
      suggestions.push("Votre code PIN pourrait être plus sécurisé");
    }

    if (pin.length === PIN_CONFIG.security.minPinLength) {
      suggestions.push(
        `Considérez un code PIN plus long (jusqu'à ${PIN_CONFIG.security.maxPinLength} chiffres) pour plus de sécurité`
      );
    }

    return suggestions;
  }

  /**
   * Évalue la force d'un code PIN
   * @param pin Le code PIN à évaluer
   * @returns Score de 0 à 100 et niveau de sécurité
   */
  static getStrength(pin: string): {
    score: number;
    level: "très_faible" | "faible" | "moyen" | "fort" | "très_fort";
    description: string;
  } {
    const result = this.validatePin(pin, { strictMode: false });
    const score = result.score;

    let level: "très_faible" | "faible" | "moyen" | "fort" | "très_fort";
    let description: string;

    if (score >= 90) {
      level = "très_fort";
      description = "Excellent code PIN, très sécurisé";
    } else if (score >= 75) {
      level = "fort";
      description = "Code PIN sécurisé";
    } else if (score >= 60) {
      level = "moyen";
      description = "Code PIN acceptable";
    } else if (score >= 40) {
      level = "faible";
      description = "Code PIN peu sécurisé";
    } else {
      level = "très_faible";
      description = "Code PIN très peu sécurisé";
    }

    return { score, level, description };
  }
}

// Exports pour compatibilité avec l'ancien code
export const validatePin = PinValidationService.isValidPin;
export const validatePinWithDetails = PinValidationService.validatePin;
