import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mode Hors Ligne - ONCC",
  description: "Page affichée en mode hors ligne",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
      <div className="mx-auto max-w-md px-6 text-center text-white">
        <div className="mb-6 animate-pulse text-6xl">📡</div>

        <h1 className="mb-4 text-3xl font-bold">Mode Hors Ligne</h1>

        <p className="mb-8 text-lg opacity-90">
          Cette page n&apos;est pas disponible hors ligne. Veuillez vous
          reconnecter à Internet pour y accéder.
        </p>

        <Link
          href="/"
          className="inline-block rounded-lg border-2 border-white/80 bg-white/20 px-6 py-3 transition-all hover:-translate-y-0.5 hover:bg-white/30"
        >
          Retour à l&apos;Accueil
        </Link>

        <p className="mt-6 text-sm opacity-75">
          Vérification de la connexion en cours...
        </p>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Vérifier la connexion toutes les 5 secondes
            setInterval(() => {
              if (navigator.onLine) {
                window.location.reload();
              }
            }, 5000);
          `,
        }}
      />
    </div>
  );
}
