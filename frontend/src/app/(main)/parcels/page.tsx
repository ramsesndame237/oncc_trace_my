"use client";

import { AppContent } from "@/components/layout/app-content";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ParcelsPage: React.FC = () => {
  return (
    <AppContent
      title="Gestion des parcelles"
      icon={<Icon name="MapIcon" />}
    >
      <div className="text-center py-12 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Gestion des parcelles</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Visualisez et gérez les parcelles des producteurs avec la localisation géographique.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pour consulter les parcelles d&apos;un producteur, utilisez le lien suivant :
          </p>
          <div className="bg-muted p-4 rounded-lg max-w-md mx-auto">
            <code className="text-sm">
              /parcels/view?actorId=[ID_PRODUCTEUR]
            </code>
          </div>
        </div>

        <div className="pt-4">
          <Button asChild>
            <Link href="/actors">
              <Icon name="UsersIcon" className="h-4 w-4" />
              Voir la liste des producteurs
            </Link>
          </Button>
        </div>
      </div>
    </AppContent>
  );
};

export default ParcelsPage;