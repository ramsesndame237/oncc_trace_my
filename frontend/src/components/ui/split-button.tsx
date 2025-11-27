"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, Loader2 } from "lucide-react";
import * as React from "react";

const splitButtonVariants = cva(
  "inline-flex items-center rounded-md overflow-hidden transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        destructive: "bg-destructive text-white",
        outline: "border border-primary text-primary bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "text-primary",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const splitButtonMainVariants = cva("font-medium transition-colors", {
  variants: {
    variant: {
      default: "hover:bg-primary/90",
      destructive: "hover:bg-destructive/90",
      outline: "hover:bg-primary/10",
      secondary: "hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      default: "px-3 py-2 text-sm",
      sm: "px-1.5 py-1.5 text-xs",
      lg: "px-3.5 py-3 text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const splitButtonDropdownVariants = cva("px-2 py-2 transition-colors", {
  variants: {
    variant: {
      default: "hover:bg-primary/90",
      destructive: "hover:bg-destructive/90",
      outline: "hover:bg-primary/10",
      secondary: "hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      default: "px-2 py-2",
      sm: "px-1.5 py-1.5",
      lg: "px-3 py-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const splitButtonSeparatorVariants = cva("w-px", {
  variants: {
    variant: {
      default: "bg-primary/50",
      destructive: "bg-destructive/50",
      outline: "bg-primary/30",
      secondary: "bg-secondary-foreground/30",
      ghost: "bg-accent",
    },
    size: {
      default: "h-6",
      sm: "h-5",
      lg: "h-7",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface SplitButtonProps
  extends Omit<React.ComponentProps<"div">, "children">,
    VariantProps<typeof splitButtonVariants> {
  /**
   * Texte du bouton principal
   */
  children: React.ReactNode;
  /**
   * Fonction appelée lors du clic sur le bouton principal (si asChild = false)
   */
  onMainClick?: () => void;
  /**
   * Si true, le bouton principal utilisera son enfant comme composant (ex: Link)
   */
  asChild?: boolean;
  /**
   * Elements du menu dropdown
   */
  dropdownItems?: Array<{
    label: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
    icon?: React.ReactNode;
  }>;
  /**
   * Position d'alignement du dropdown
   */
  dropdownAlign?: "start" | "center" | "end";
  /**
   * Largeur du dropdown
   */
  dropdownWidth?: string;
  /**
   * État désactivé
   */
  disabled?: boolean;
  /**
   * État de chargement
   */
  loading?: boolean;
}

const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      onMainClick,
      asChild = false,
      dropdownItems = [],
      dropdownAlign = "end",
      dropdownWidth = "160px",
      disabled = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const MainComp = asChild ? Slot : "button";

    return (
      <div
        ref={ref}
        className={cn(splitButtonVariants({ variant, size }), className)}
        {...props}
      >
        {/* Bouton principal */}
        <MainComp
          {...(!asChild && {
            onClick: onMainClick,
            disabled: disabled || loading,
          })}
          className={cn(splitButtonMainVariants({ variant, size }))}
        >
          {loading && !asChild ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Chargement...
            </>
          ) : (
            children
          )}
        </MainComp>

        {/* Séparateur */}
        <div className={cn(splitButtonSeparatorVariants({ variant, size }))} />

        {/* Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={disabled || loading}
              className={cn(splitButtonDropdownVariants({ variant, size }))}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={dropdownAlign}
            style={{ width: dropdownWidth }}
          >
            {dropdownItems.map((item, index) => (
              <DropdownMenuItem
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                className={
                  item.destructive ? "text-red-600 focus:text-red-600" : ""
                }
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

SplitButton.displayName = "SplitButton";

export { SplitButton, splitButtonVariants };

/**
 * Exemples d'utilisation du SplitButton :
 *
 * 1. Bouton classique avec fonction onClick :
 * <SplitButton
 *   onMainClick={() => console.log("Action principale")}
 *   dropdownItems={[
 *     { label: "Option 1", onClick: () => {}, icon: <Icon /> },
 *     { label: "Option 2", onClick: () => {}, destructive: true }
 *   ]}
 * >
 *   Action principale
 * </SplitButton>
 *
 * 2. Avec Next.js Link (asChild) :
 * <SplitButton
 *   asChild
 *   dropdownItems={dropdownItems}
 *   variant="outline"
 * >
 *   <Link href="/details">Voir les détails</Link>
 * </SplitButton>
 *
 * 3. Avec router.push() ou autres composants :
 * <SplitButton
 *   asChild
 *   dropdownItems={dropdownItems}
 * >
 *   <button onClick={() => router.push('/path')}>
 *     Navigation
 *   </button>
 * </SplitButton>
 */
