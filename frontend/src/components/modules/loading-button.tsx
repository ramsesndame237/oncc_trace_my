"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  asChild?: boolean;
}

export default function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  className,
  disabled,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      className={cn(
        isLoading
          ? "bg-secondary text-white hover:bg-secondary/90"
          : "bg-primary text-white hover:bg-primary/90",
        className
      )}
      disabled={isLoading || disabled}
      variant={variant}
      size={size}
      asChild={asChild}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
