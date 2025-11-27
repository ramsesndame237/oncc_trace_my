"use client";

import type L from "leaflet";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiParcelResponse } from "../../domain/parcel.types";
import { MapViewController } from "./MapViewController";

// Import dynamique de Leaflet pour éviter les erreurs SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
);

interface ParcelMapProps {
  parcels: ApiParcelResponse[];
  selectedParcel?: ApiParcelResponse;
  onParcelSelect?: (parcel: ApiParcelResponse) => void;
  className?: string;
}

export const ParcelMap: React.FC<ParcelMapProps> = ({
  parcels,
  selectedParcel,
  onParcelSelect,
  className = "h-96",
}) => {
  const [isClient, setIsClient] = useState(false);
  const [leafletIcon, setLeafletIcon] = useState<L.Icon | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Configuration de l'icône Leaflet
    const setupLeafletIcon = async () => {
      try {
        const L = await import("leaflet");

        // Fix pour les icônes par défaut de Leaflet
        delete (
          L.Icon.Default.prototype as L.Icon & { _getIconUrl?: () => string }
        )._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "/leaflet/marker-icon-2x.png",
          iconUrl: "/leaflet/marker-icon.png",
          shadowUrl: "/leaflet/marker-shadow.png",
        });

        // Icône personnalisée pour les parcelles
        const customIcon = new L.Icon({
          iconUrl: "/leaflet/marker-icon.png",
          iconRetinaUrl: "/leaflet/marker-icon-2x.png",
          shadowUrl: "/leaflet/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        setLeafletIcon(customIcon);
      } catch (error) {
        console.error("Erreur lors du chargement de Leaflet:", error);
        setMapError("Impossible de charger la bibliothèque de cartes");
      }
    };

    setupLeafletIcon();
  }, []);

  // Valider et filtrer les parcelles avec coordonnées valides
  const parcelsWithCoords = useMemo(() => {
    return parcels.filter((parcel) => {
      if (!parcel.coordinates || parcel.coordinates.length === 0) {
        return false;
      }

      // Vérifier que toutes les coordonnées sont valides
      const hasInvalidCoords = parcel.coordinates.some(
        (coord) =>
          coord.latitude === null ||
          coord.longitude === null ||
          isNaN(coord.latitude) ||
          isNaN(coord.longitude) ||
          coord.latitude < -90 ||
          coord.latitude > 90 ||
          coord.longitude < -180 ||
          coord.longitude > 180
      );

      if (hasInvalidCoords) {
        console.warn(
          `⚠️ Parcelle ${parcel.id} ignorée : coordonnées invalides`,
          parcel.coordinates
        );
        return false;
      }

      return true;
    });
  }, [parcels]);

  // Calculer le centre d'une parcelle (centroïde pour polygone ou point unique)
  const getParcelCenter = useCallback(
    (parcel: ApiParcelResponse): [number, number] => {
      if (!parcel.coordinates || parcel.coordinates.length === 0) {
        return [3.848, 11.502]; // Coordonnées par défaut
      }

      try {
        // Calculer le centroïde des coordonnées
        const sumLat = parcel.coordinates.reduce(
          (sum, coord) => sum + coord.latitude,
          0
        );
        const sumLng = parcel.coordinates.reduce(
          (sum, coord) => sum + coord.longitude,
          0
        );

        const centerLat = sumLat / parcel.coordinates.length;
        const centerLng = sumLng / parcel.coordinates.length;

        // Vérifier que le résultat est valide
        if (isNaN(centerLat) || isNaN(centerLng)) {
          console.error("Centre invalide calculé pour parcelle:", parcel.id);
          return [3.848, 11.502];
        }

        return [centerLat, centerLng];
      } catch (error) {
        console.error("Erreur calcul centre parcelle:", error);
        return [3.848, 11.502];
      }
    },
    []
  );

  // Calculer le zoom optimal pour une parcelle
  const getOptimalZoom = (parcel: ApiParcelResponse): number => {
    if (!parcel.coordinates || parcel.coordinates.length === 0) {
      return 10;
    }

    try {
      // Pour un point unique, zoom élevé
      if (parcel.coordinates.length === 1) {
        return 16;
      }

      // Pour un polygone, calculer la zone couverte pour ajuster le zoom
      const lats = parcel.coordinates.map((coord) => coord.latitude);
      const lngs = parcel.coordinates.map((coord) => coord.longitude);

      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);
      const maxRange = Math.max(latRange, lngRange);

      // Vérifier que les valeurs sont valides
      if (isNaN(maxRange) || maxRange === 0) {
        return 16;
      }

      // Ajuster le zoom selon la taille du polygone
      if (maxRange < 0.001) return 17; // Très petit polygone
      if (maxRange < 0.005) return 15; // Petit polygone
      if (maxRange < 0.01) return 13; // Polygone moyen
      if (maxRange < 0.05) return 11; // Grand polygone
      return 9; // Très grand polygone
    } catch (error) {
      console.error("Erreur calcul zoom optimal:", error);
      return 10;
    }
  };

  // Calculer le centre de la carte
  const getMapCenter = useCallback((): [number, number] => {
    if (
      selectedParcel &&
      selectedParcel.coordinates &&
      selectedParcel.coordinates.length > 0
    ) {
      return getParcelCenter(selectedParcel);
    }

    if (parcelsWithCoords.length > 0) {
      try {
        // Calculer le centre de toutes les parcelles
        let totalLat = 0;
        let totalLng = 0;
        let totalPoints = 0;

        parcelsWithCoords.forEach((parcel) => {
          if (parcel.coordinates) {
            parcel.coordinates.forEach((coord) => {
              totalLat += coord.latitude;
              totalLng += coord.longitude;
              totalPoints++;
            });
          }
        });

        if (totalPoints > 0) {
          const centerLat = totalLat / totalPoints;
          const centerLng = totalLng / totalPoints;

          if (!isNaN(centerLat) && !isNaN(centerLng)) {
            return [centerLat, centerLng];
          }
        }
      } catch (error) {
        console.error("Erreur calcul centre carte:", error);
      }
    }

    // Coordonnées par défaut (Cameroun)
    return [3.848, 11.502];
  }, [selectedParcel, parcelsWithCoords, getParcelCenter]);

  // États calculés pour la vue
  const mapCenter = useMemo(() => getMapCenter(), [getMapCenter]);
  const mapZoom = useMemo(
    () => (selectedParcel ? getOptimalZoom(selectedParcel) : 10),
    [selectedParcel]
  );

  // États de chargement et erreur
  if (mapError) {
    return (
      <div
        className={`bg-destructive/10 border border-destructive rounded-lg flex items-center justify-center ${className}`}
      >
        <p className="text-destructive text-sm">{mapError}</p>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
      >
        <p className="text-muted-foreground">Chargement de la carte...</p>
      </div>
    );
  }

  if (parcelsWithCoords.length === 0) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center ${className}`}
      >
        <p className="text-muted-foreground">
          Aucune parcelle avec coordonnées géographiques valides
        </p>
      </div>
    );
  }

  try {
    return (
      <div className={className}>
        <MapContainer
          // ✅ KEY CONSTANT - Ne jamais changer pour éviter le remount
          key="parcel-map-container"
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full rounded-lg"
          zoomControl={true}
          dragging={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
        >
          {/* Contrôleur de vue pour mettre à jour centre/zoom sans remount */}
          <MapViewController center={mapCenter} zoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {parcelsWithCoords.map((parcel, index) => {
            const coordinates = parcel.coordinates!;

            // Popup commun pour marker et polygone
            const popupContent = (
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm">Parcelle {index + 1}</h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    Code: {parcel.locationCode}
                  </p>
                  <p className="text-xs">Superficie: {parcel.surfaceArea} m²</p>
                  <p className="text-xs text-muted-foreground mb-1">
                    Points: {coordinates.length}
                  </p>
                  {parcel.location && (
                    <p className="text-xs text-muted-foreground">
                      {parcel.location.name}
                    </p>
                  )}
                </div>
              </Popup>
            );

            // Si un seul point, afficher un marker
            if (coordinates.length === 1) {
              const lat = coordinates[0].latitude;
              const lng = coordinates[0].longitude;

              // Ne pas afficher le marker si l'icône n'est pas encore chargée
              if (!leafletIcon) {
                return null;
              }

              return (
                <Marker
                  key={parcel.id}
                  position={[lat, lng]}
                  icon={leafletIcon}
                  eventHandlers={{
                    click: () => onParcelSelect?.(parcel),
                  }}
                >
                  {popupContent}
                </Marker>
              );
            }

            // Si plusieurs points, afficher un polygone
            const polygonPositions: [number, number][] = coordinates.map(
              (coord) => [coord.latitude, coord.longitude]
            );

            return (
              <Polygon
                key={parcel.id}
                positions={polygonPositions}
                pathOptions={{
                  color: selectedParcel?.id === parcel.id ? "#3b82f6" : "#10b981",
                  fillColor:
                    selectedParcel?.id === parcel.id ? "#3b82f6" : "#10b981",
                  fillOpacity: 0.3,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onParcelSelect?.(parcel),
                }}
              >
                {popupContent}
              </Polygon>
            );
          })}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error("Erreur critique lors du rendu de la carte:", error);
    return (
      <div
        className={`bg-destructive/10 border border-destructive rounded-lg flex items-center justify-center ${className}`}
      >
        <p className="text-destructive text-sm">
          Erreur lors de l&apos;affichage de la carte
        </p>
      </div>
    );
  }
};
