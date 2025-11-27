"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionTimer } from "@/components/layout/session-timer";
import { Container } from "@/components/modules/container";
import { PageLoader } from "@/components/modules/page-loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePolling } from "@/core/infrastructure/hooks";
import { AuthGuard } from "@/features/auth";
import { PinGuard } from "@/features/pin";
import { Suspense } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⭐ Démarrage automatique du polling quand l'utilisateur est authentifié
  usePolling();

  return (
    <AuthGuard>
      <PinGuard>
        {/* ✅ Layout toujours visible après vérification auth/PIN */}
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-[#F9F9F9]">
            <AppHeader />
            <Container padding={"large"} size={"default"}>
              {/* ✅ Suspense : seul le contenu se recharge, pas le layout */}
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            </Container>
          </SidebarInset>
          <SessionTimer />
        </SidebarProvider>
      </PinGuard>
    </AuthGuard>
  );
}
