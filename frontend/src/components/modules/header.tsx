import * as React from "react";

import { cn } from "@/lib/utils";
import { Container } from "./container";

export const Header = ({
  className,
  ...props
}: {
  className?: string;
  leftContent?: React.ReactNode;
  leftClassName?: string;
  rightContent?: React.ReactNode;
  rightClassName?: string;
  centerContent?: React.ReactNode;
  centerClassName?: string;
}) => {
  return (
    <div className={cn("", className)}>
      <Container
        size="full"
        padding="banner"
        className="flex items-center justify-between gap-x-4"
      >
        {props.leftContent && (
          <div className={cn(props.leftClassName)}>{props.leftContent}</div>
        )}
        {props.centerContent && (
          <div className={cn(props.centerClassName)}>{props.centerContent}</div>
        )}
        {props.rightContent && (
          <div className={cn(props.rightClassName)}>{props.rightContent}</div>
        )}
      </Container>
    </div>
  );
};
