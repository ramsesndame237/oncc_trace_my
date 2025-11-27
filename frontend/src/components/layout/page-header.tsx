"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { Heading } from "../modules/heading";

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  backUrl?: string;
  backAction?: () => void;
  rightContent?: ReactNode[];
  className?: string;
}

export default function PageHeader({
  title,
  icon,
  backUrl,
  backAction,
  rightContent,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backAction) {
      backAction();
    } else if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full px-4 py-3.5 flex items-center justify-between border-b border-gray-300 bg-white",
        className
      )}
    >
      <div className="flex items-center min-w-0 flex-1">
        {icon && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-4 flex-shrink-0"
          >
            {icon}
          </Button>
        )}
        <Heading size="body" className=" font-medium truncate min-w-0">
          {title}
        </Heading>
      </div>

      {rightContent && (
        <div className="flex items-center flex-shrink-0 ml-4">
          {rightContent}
        </div>
      )}
    </header>
  );
}
