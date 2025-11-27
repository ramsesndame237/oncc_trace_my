import { Providers } from "@/components/layout/providers";
import { Toaster } from "@/components/ui/sonner";
import { configureDI } from "@/core/infrastructure/di/container";
import commonEn from "@/i18n/locales/en/common.json";
import commonFr from "@/i18n/locales/fr/common.json";
import { appConfig } from "@/lib/config";
import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

// Initialiser le conteneur DI dès le chargement du module
configureDI();

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Note: localStorage n'est pas accessible côté serveur
  // La langue sera détectée côté client par i18next
  // Ici on utilise le français par défaut, ou on pourrait lire un cookie si configuré
  const cookieStore = await cookies();
  const locale = cookieStore.get("i18nextLng")?.value || "fr";
  const translations = locale === "en" ? commonEn : commonFr;

  // Le titre vient de appConfig (pas traduit), la description est traduite
  return {
    title: `${appConfig.name} - ${
      appConfig.description || translations.app.description
    }`,
    description: translations.app.description,
    icons: {
      icon: "/logo/logo.png",
    },
  };
}

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${notoSans.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
