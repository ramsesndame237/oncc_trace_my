"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { ReactNode } from "react";

interface ContentCardProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  title?: string | ReactNode;
  titlePosition?: "top" | "center";
  withHeaderImage?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
}

export default function ContentCard({
  children,
  className,
  maxWidth = "max-w-md",
  title,
  titlePosition = "center",
  withHeaderImage = false,
  imageSrc = "/logo/logo.png",
  imageAlt = "Logo",
  headerClassName,
  bodyClassName,
  footer,
  footerClassName,
}: ContentCardProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${maxWidth} w-full`}
    >
      <div
        className={cn(
          `w-full ${maxWidth} p-8 bg-white rounded-lg shadow-sm border border-[#e0e0e0]`,
          className
        )}
      >
        {/* Header avec logo et titre optionnels */}
        {(title || withHeaderImage) && (
          <div
            className={cn(
              "flex flex-col mb-8",
              titlePosition === "center" ? "items-center" : "items-start",
              headerClassName
            )}
          >
            {withHeaderImage && (
              <div className="mb-4 relative h-[100px] w-[100px]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="100px"
                  style={{ objectFit: "contain" }}
                  className="h-auto"
                />
              </div>
            )}

            {title && typeof title === "string" ? (
              <h1 className="text-2xl font-medium text-primary">{title}</h1>
            ) : (
              title
            )}
          </div>
        )}

        {/* Contenu principal */}
        <div className={cn(bodyClassName)}>{children}</div>
      </div>
      {footer && <div className={cn(footerClassName)}>{footer}</div>}
    </div>
  );
}
