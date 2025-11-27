"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapViewControllerProps {
  center: [number, number];
  zoom: number;
}

/**
 * Composant interne pour contrôler la vue de la carte sans forcer un remount
 * Utilise le hook useMap de react-leaflet pour mettre à jour la position
 */
export const MapViewController: React.FC<MapViewControllerProps> = ({
  center,
  zoom,
}) => {
  const map = useMap();

  useEffect(() => {
    if (map && center && zoom) {
      try {
        // Animer la transition vers le nouveau centre/zoom
        map.setView(center, zoom, {
          animate: true,
          duration: 0.5,
        });
      } catch (error) {
        console.warn("Erreur lors du setView:", error);
      }
    }
  }, [map, center, zoom]);

  return null;
};
