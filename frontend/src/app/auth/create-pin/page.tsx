"use client";
import LanguageSelector from "@/components/layout/language-selector";
import ContentCard from "@/components/modules/content-card";
import { LoadingFallback } from "@/components/modules/loading-fallback";
import { CreatePinForm } from "@/features/pin";
import { appConfig } from "@/lib/config";
import { useTranslation } from "react-i18next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function CreatePinPage() {
  const { t } = useTranslation("pin");
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth/login");
    },
  });

  if (status === "loading") {
    return <LoadingFallback message={t("verifyingSession")} />;
  }

  return (
    <Suspense
      fallback={
        <LoadingFallback message={t("loading")} />
      }
    >
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        <header className="flex justify-end p-4 w-full">
          <LanguageSelector />
        </header>

        <main className="flex flex-1 justify-center items-center p-4">
          <ContentCard
            title={t("form.title")}
            withHeaderImage
            imageSrc="/logo/logo.png"
            imageAlt={`${appConfig.name} Logo`}
            titlePosition="center"
            maxWidth="max-w-md"
            headerClassName="items-center"
          >
            <CreatePinForm />
          </ContentCard>
        </main>
      </div>
    </Suspense>
  );
}
