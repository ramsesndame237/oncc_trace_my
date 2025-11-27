"use client";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import * as React from "react";

export const containerVariant = cva("w-full relative", {
  variants: {
    size: {
      default: "mx-auto lg:max-w-5xl",
      large: "mx-auto lg:max-w-screen-2xl",
      full: "max-w-full",
    },
    padding: {
      default: "p-2.5 lg:p-4",
      large: "p-4 lg:p-8",
      no: "p-0",
      banner: "p-2.5 lg:p-2",
    },
  },
  defaultVariants: {
    size: "default",
    padding: "default",
  },
});

export type ContainerSizeType = VariantProps<typeof containerVariant>["size"];

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariant> {
  size?: ContainerSizeType;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ className, size, padding, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={containerVariant({ padding, size, className })}
        {...props}
      />
    );
  }
);
