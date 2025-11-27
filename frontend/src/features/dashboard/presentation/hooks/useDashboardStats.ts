"use client";

import { DI_TOKENS } from "@/core/infrastructure/di/tokens";
import { IProductionBasinRepository } from "@/features/production-basin/domain/IProductionBasinRepository";
import { ProductionBasinStats } from "@/features/production-basin/domain/productionBasin.types";
import { StoreStats } from "@/features/store/domain";
import { IStoreRepository } from "@/features/store/domain/IStoreRepository";
import { IUserRepository } from "@/features/user/domain/IUserRepository";
import { UserStats } from "@/features/user/domain/user.types";
import { useEffect, useState } from "react";
import { container } from "tsyringe";

interface DashboardStatsData {
  stores: StoreStats | null;
  users: UserStats | null;
  basins: ProductionBasinStats | null;
  campaign: {
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
}

interface UseDashboardStatsReturn {
  stats: DashboardStatsData;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStatsData>({
    stores: null,
    users: null,
    basins: null,
    campaign: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer les statistiques des magasins, utilisateurs et bassins
      const storeRepository = container.resolve<IStoreRepository>(
        DI_TOKENS.IStoreRepository
      );
      const userRepository = container.resolve<IUserRepository>(
        DI_TOKENS.IUserRepository
      );
      const basinRepository = container.resolve<IProductionBasinRepository>(
        DI_TOKENS.IProductionBasinRepository
      );

      // Récupérer les statistiques individuellement pour éviter qu'une erreur bloque tout
      const [storeStats, userStats, basinStats] = await Promise.allSettled([
        storeRepository.getStats(),
        userRepository.getStats(),
        basinRepository.getStats(),
      ]);

      setStats({
        stores: storeStats.status === "fulfilled" ? storeStats.value : null,
        users: userStats.status === "fulfilled" ? userStats.value : null,
        basins: basinStats.status === "fulfilled" ? basinStats.value : null,
        campaign: {
          name: "Campagne Cacao 2024-2025",
          status: "active",
          startDate: "2024-10-01",
          endDate: "2025-03-31",
        }, // Mock data for now
      });

      // Logger les erreurs individuelles sans arrêter l'affichage
      if (storeStats.status === "rejected") {
        console.error("Erreur lors de la récupération des statistiques magasins:", storeStats.reason);
      }
      if (userStats.status === "rejected") {
        console.error("Erreur lors de la récupération des statistiques utilisateurs:", userStats.reason);
      }
      if (basinStats.status === "rejected") {
        console.error("Erreur lors de la récupération des statistiques bassins:", basinStats.reason);
      }

    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des statistiques"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
