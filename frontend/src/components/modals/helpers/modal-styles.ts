import { cn } from "@/lib/utils";
import { type WrapperModalProps } from "./modal-types";

/**
 * Générer les classes CSS pour le modal selon sa configuration
 */
export const getModalClasses = (props: WrapperModalProps) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full max-h-full"
  };

  const variantClasses = {
    default: "",
    destructive: "border-destructive/20",
    success: "border-green-500/20"
  };

  return cn(
    sizeClasses[props.size || "md"],
    variantClasses[props.variant || "default"],
    props.className
  );
};

/**
 * Générer les classes CSS pour les boutons selon leur variant
 */
export const getButtonVariantClasses = (variant?: string) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };

  return variants[variant as keyof typeof variants] || variants.default;
};