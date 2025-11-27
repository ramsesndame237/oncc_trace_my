import { useLocationStore } from "@/features/location/infrastructure/store/locationStore";
import { useEffect, useMemo } from "react";
import { getLocationHierarchy } from "../../domain/location.utils";

export const useLocationHierarchy = (code: string) => {
  const { allLocations, isLoading, fetchAllLocations } = useLocationStore();

  useEffect(() => {
    if (allLocations.length === 0 && !isLoading) {
      // console.log("📡 useLocationHierarchy - Fetching all locations...");
      fetchAllLocations();
    }
  }, [fetchAllLocations, allLocations.length, isLoading]);

  const path = useMemo(() => {
    const hierarchy = getLocationHierarchy(code, allLocations);
    // console.log("🏗️ useLocationHierarchy - Code:", code, "AllLocations count:", allLocations.length, "Hierarchy:", hierarchy);
    return hierarchy;
  }, [code, allLocations]);

  return {
    path,
    isLoading: isLoading && allLocations.length === 0,
  };
};
