import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const headingVariants = cva("font-bold leading-tight tracking-wide", {
  variants: {
    color: {
      default: "text-foreground",
      primary: "text-primary",
    },
    size: {
      h1: "lg:text-2xl text-xl",
      h2: "lg:text-xl text-lg",
      h3: "lg:text-lg text-base",
      body: "lg:text-base text-sm",
      bodySmall: "lg:text-sm text-xs",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    alignment: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: {
    color: "default",
    size: "h1",
    alignment: "left",
    weight: "semibold",
  },
});

export interface HeadingProps extends VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  children: ReactNode;
  className?: string;
}

export const Heading = ({
  as: Component = "div",
  color,
  size,
  alignment,
  children,
  className,
  weight,
}: HeadingProps) => {
  return (
    <Component
      className={cn(
        headingVariants({ color, size, alignment, weight }),
        className
      )}
    >
      {children}
    </Component>
  );
};
