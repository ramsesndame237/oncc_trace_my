import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/max"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un numéro de téléphone pour l'affichage en format international
 * @param phone - Numéro de téléphone brut (ex: "237677889900" ou "+237677889900")  
 * @param defaultCountry - Code pays par défaut (défaut: "CM" pour Cameroun)
 * @returns Numéro formaté (ex: "+237 6 77 88 99 00") ou valeur originale si erreur
 */
export function formatPhoneDisplay(
  phone: string | null | undefined, 
  defaultCountry: CountryCode = "CM"
): string {
  if (!phone) return "---";
  
  try {
    // Normaliser le format pour parsing - ajouter + si manquant
    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const parsed = parsePhoneNumberFromString(normalizedPhone, defaultCountry);
    
    // Retourner le format international ou la valeur originale
    return parsed?.formatInternational() || phone;
  } catch {
    // Fallback gracieux sur valeur originale en cas d'erreur
    return phone;
  }
}
