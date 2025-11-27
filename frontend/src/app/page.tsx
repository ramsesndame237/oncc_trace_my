"use client";

import { Container } from "@/components/modules/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGuard } from "@/features/auth";
import { appConfig } from "@/lib/config";
import { BarChart3, Shield, Smartphone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center">
        <Container className="text-center">
          <div className="mb-8">
            <Image
              src="/logo/logo.png"
              alt="Logo"
              width={120}
              height={120}
              className="mx-auto mb-4"
            />
            <h1 className="text-5xl font-bold text-primary mb-4">
              {appConfig.name}
            </h1>
            <p className="text-xl text-primary mb-8 font-medium">
              {t("app.description")}
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("app.longDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-green-200 hover:shadow-lg transition-shadow p-6 border-2 space-y-4">
              <CardHeader>
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-green-800">
                  {t("homepage.features.secure.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accent-foreground">
                  {t("homepage.features.secure.description")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 hover:shadow-lg transition-shadow p-6 border-2 space-y-4">
              <CardHeader>
                <Smartphone className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <CardTitle className="text-amber-800">
                  {t("homepage.features.mobileFirst.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accent-foreground">
                  {t("homepage.features.mobileFirst.description")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-lg transition-shadow p-6 border-2 space-y-4">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-blue-800">
                  {t("homepage.features.analytics.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accent-foreground">
                  {t("homepage.features.analytics.description")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Button size="lg" onClick={() => router.push("/auth/login")}>
              {t("homepage.login.button")}
            </Button>
            <p className="text-sm text-accent-foreground">
              {t("homepage.login.subtitle")}
            </p>
          </div>
        </Container>
      </div>
    </AuthGuard>
  );
}
