"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:!shadow-lg",
          description: "group-[.toast]:!text-white",
          actionButton:
            "group-[.toast]:!bg-primary group-[.toast]:!text-primary-foreground",
          cancelButton:
            "group-[.toast]:!bg-muted group-[.toast]:!text-muted-foreground",
          error:
            "group-[.toaster]:!bg-destructive group-[.toaster]:!text-white group-[.toaster]:!border-destructive",
          success:
            "group-[.toaster]:!bg-primary group-[.toaster]:!text-white group-[.toaster]:!border-primary",
          info: "group-[.toaster]:!bg-blue-500 group-[.toaster]:!text-white group-[.toaster]:!border-blue-500",
          warning:
            "group-[.toaster]:!bg-yellow-500 group-[.toaster]:!text-white group-[.toaster]:!border-yellow-500",
        },
      }}
    />
  );
}
