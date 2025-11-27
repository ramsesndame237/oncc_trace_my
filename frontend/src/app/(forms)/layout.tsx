"use client";

import { AuthGuard } from "@/features/auth";
import { PinGuard } from "@/features/pin";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PinGuard>{children}</PinGuard>
    </AuthGuard>
  );
}
