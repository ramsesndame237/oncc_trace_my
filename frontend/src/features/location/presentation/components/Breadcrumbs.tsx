"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useLocationHierarchy } from "../hooks/useLocationHierarchy";

export const Breadcrumbs = () => {
  const searchParams = useSearchParams();
  const locationCode = searchParams.get("locationCode");

  // Utilisation du hook centralisé qui retourne { path, isLoading }
  const { path, isLoading } = useLocationHierarchy(locationCode || "");

  if (isLoading) {
    return <div className="h-5 animate-pulse bg-gray-200 rounded w-1/3"></div>;
  }

  const breadcrumbs = [
    { name: "Cameroun", href: "/locations" },
    // Construction des liens à partir du chemin retourné par le hook
    ...path.map((segment) => ({
      name: segment.name, // Utilise le nom de la localisation
      href: `/locations?locationCode=${segment.code}`,
    })),
  ];

  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          <Button
            asChild
            variant={index === breadcrumbs.length - 1 ? "ghost" : "link"}
            className="!p-0 h-auto disabled:opacity-100 disabled:no-underline capitalize"
            disabled={index === breadcrumbs.length - 1}
          >
            <Link href={crumb.href}>{crumb.name.toLowerCase()}</Link>
          </Button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
