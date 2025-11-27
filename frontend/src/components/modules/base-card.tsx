"use client";

import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BaseCardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  classNameFooter?: string;
}

export function BaseCard({
  title,
  children,
  footer,
  className,
  classNameFooter,
}: BaseCardProps) {
  return (
    <div
      className={cn(
        "border border-gray-300 my-10 lg:my-0 lg:rounded-lg overflow-hidden bg-white",
        className
      )}
    >
      {/* En-tête avec le titre */}
      {title && (
        <CardHeader className="px-8 py-6 border-b border-gray-300 [.border-b]:pb-4">
          {typeof title === "string" ? (
            <CardTitle className="text-2xl">{title}</CardTitle>
          ) : (
            title
          )}
        </CardHeader>
      )}

      {/* Contenu principal */}
      <CardContent className="lg:px-8 px-6 py-6">{children}</CardContent>

      {/* Footer optionnel */}
      {footer && (
        <CardFooter
          align="start"
          orientation="horizontal"
          className={cn("px-8 py-6", classNameFooter)}
        >
          {footer}
        </CardFooter>
      )}
    </div>
  );
}
