"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import React from "react";

export interface SearchInputProps {
  /** Valeur actuelle de la recherche */
  value: string;
  /** Fonction appelée lors du changement de valeur */
  onChange: (value: string) => void;
  /** Fonction appelée lors de la réinitialisation */
  onReset: () => void;
  /** Texte d'indication dans le champ */
  placeholder: string;
  /** Indique s'il y a des filtres actifs (affiche le bouton reset) */
  hasActiveFilters?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
  /** ID du champ pour l'accessibilité */
  id?: string;
  /** Désactiver le champ */
  disabled?: boolean;
}

/**
 * Composant de recherche modulaire et réutilisable
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const hasFilters = search !== "";
 * 
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   onReset={() => setSearch("")}
 *   placeholder="Rechercher..."
 *   hasActiveFilters={hasFilters}
 * />
 * ```
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onReset,
  placeholder,
  hasActiveFilters = false,
  className,
  id,
  disabled = false,
}) => {
  return (
    <div className={cn("relative flex-1 max-w-sm", className)}>
      <Search 
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" 
        aria-hidden="true"
      />
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pl-10"
        aria-label={placeholder}
      />
      {hasActiveFilters && !disabled && (
        <button
          onClick={onReset}
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer hover:text-foreground transition-colors"
          tabIndex={-1}
          type="button"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};