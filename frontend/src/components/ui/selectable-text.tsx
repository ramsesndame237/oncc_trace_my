"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface SelectableTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Composant qui rend le texte facilement sélectionnable par double-clic
 * avec un style visuel qui indique qu'il est sélectionnable
 */
export function SelectableText({
  children,
  className,
  ...props
}: SelectableTextProps) {
  return (
    <span
      className={cn(
        // Style de base pour la sélectabilité
        "select-all cursor-pointer inline-block mt-1",
        // Style visuel pour indiquer que c'est sélectionnable
        "bg-gray-200 border border-gray-300 px-2 py-1 rounded-sm",
        // Style pour le texte primaire avec centrage
        "font-mono text-sm font-semibold text-primary",
        className
      )}
      tabIndex={0} // Rendre focusable pour l'accessibilité
      title="Double-cliquez pour sélectionner ce texte"
      {...props}
    >
      {children}
    </span>
  );
}
