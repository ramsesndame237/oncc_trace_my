"use client";

import { AuthGuard } from "@/features/auth";
import { DashboardContent } from "@/features/dashboard";
import { Coffee } from "lucide-react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";


export default function DashboardPage() {
  const { t } = useTranslation('dashboard');

  return (
    <AuthGuard requireAuth={true}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-amber-50">
            <div className="text-center">
              <Coffee className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-green-600">{t('page.loading')}</p>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  );
}
