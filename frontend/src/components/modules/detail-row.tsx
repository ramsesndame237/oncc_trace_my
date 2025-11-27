"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Heading } from "./heading";

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  showChangeButton?: boolean;
  changeHref?: string;
  onChangeClick?: () => void;
  changeButtonText?: string;
  customAction?: React.ReactNode;
  noBorder?: boolean;
  /**
   * Active le layout vertical sur mobile (empilé) au lieu du layout horizontal (grille)
   * @default false
   */
  stackOnMobile?: boolean;
}

export function DetailRow({
  label,
  value,
  showChangeButton,
  changeHref,
  onChangeClick,
  changeButtonText = "Modifier",
  customAction,
  noBorder,
  stackOnMobile = false,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        "pt-1 pb-4 border-b border-gray-200 last:border-0 grid items-start",
        stackOnMobile
          ? "grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6"
          : "grid-cols-12 gap-6",
        noBorder && "border-0"
      )}
    >
      <Heading
        as="h3"
        size="body"
        className={stackOnMobile ? "sm:col-span-4" : "col-span-4"}
        weight={"medium"}
      >
        {label}
      </Heading>
      <Heading
        as="div"
        size="bodySmall"
        className={cn(
          stackOnMobile ? "sm:col-span-6" : "col-span-4",
          "!font-normal"
        )}
      >
        {value}
      </Heading>
      {(showChangeButton || customAction) && (
        <div
          className={
            stackOnMobile
              ? "sm:col-span-2 sm:text-right"
              : "col-span-4 text-right"
          }
        >
          {customAction ? (
            customAction
          ) : onChangeClick ? (
            <Button
              variant="link"
              size="sm"
              className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
              onClick={onChangeClick}
            >
              {changeButtonText}
            </Button>
          ) : (
            changeHref && (
              <Button
                variant="link"
                size="sm"
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
              >
                <Link href={changeHref}>{changeButtonText}</Link>
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
