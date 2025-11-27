"use client";

import { StatsGrid } from "@/components/modules";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useDashboardStats } from "../hooks/useDashboardStats";

interface AdminDashboardProps {
  // Ces données seront récupérées via des services plus tard
  stats?: {
    totalStores: number;
    activeStores: number;
    totalUsers: number;
    totalBasins: number;
    currentCampaign?: {
      name: string;
      status: string;
      startDate: string;
      endDate: string;
    };
  };
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const { t } = useTranslation('dashboard');
  const router = useRouter();
  const { stats: dashboardStats, isLoading, error } = useDashboardStats();
  type CurrentCampaign = NonNullable<
    AdminDashboardProps["stats"]
  >["currentCampaign"];
  const totalStoresValue: number =
    dashboardStats.stores?.total ?? stats?.totalStores ?? 0;
  const activeStoresValue: number =
    dashboardStats.stores?.active ?? stats?.activeStores ?? 0;
  const totalUsersValue: number =
    dashboardStats.users?.total ?? stats?.totalUsers ?? 0;
  const totalBasinsValue: number =
    dashboardStats.basins?.total ?? stats?.totalBasins ?? 0;
  const currentCampaignValue: CurrentCampaign | null =
    dashboardStats.campaign ?? stats?.currentCampaign ?? null;

  const currentStats = {
    totalStores: totalStoresValue,
    activeStores: activeStoresValue,
    totalUsers: totalUsersValue,
    totalBasins: totalBasinsValue,
    currentCampaign: currentCampaignValue,
  };

  // Calculer les tendances basées sur les données réelles
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const handleStoreClick = () => {
    router.push("/stores");
  };

  const handleUserClick = () => {
    router.push("/users");
  };

  const handleBasinClick = () => {
    router.push("/production-basin");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCampaignClick = () => {
    router.push("/campaign");
  };

  // Affichage en cas de chargement
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{t('stats.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                {t('stats.error')}
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Vue d'ensemble des statistiques */}
      <StatsGrid
        title={t('admin.generalStats')}
        subtitle={t('admin.generalStatsSubtitle')}
        globalConsultText={t('stats.viewReports')}
        columns={4}
        stats={[
          {
            title: t('admin.totalStores'),
            value: totalStoresValue,
            description: t('admin.activeStoresPercentage', {
              percentage: totalStoresValue > 0
                ? Math.round((activeStoresValue / totalStoresValue) * 100)
                : 0
            }),
            onClick: handleStoreClick,
            trend: dashboardStats.stores
              ? {
                  value: t('admin.trend.active', {
                    active: currentStats.activeStores,
                    total: currentStats.totalStores
                  }),
                  label: t('admin.trend.activeLabel'),
                }
              : undefined,
          },
          {
            title: t('admin.users'),
            value: currentStats.totalUsers,
            description: dashboardStats.users
              ? t('admin.activeUsers', { count: dashboardStats.users.active })
              : t('admin.activeUsersDescription'),
            onClick: handleUserClick,
            trend: dashboardStats.users
              ? {
                  value: t('admin.trend.active', {
                    active: dashboardStats.users.active,
                    total: dashboardStats.users.total
                  }),
                  label: t('admin.trend.activeLabel'),
                }
              : {
                  value: "+8.7%",
                  isPositive: true,
                  label: t('admin.trend.thisMonth'),
                },
          },
          {
            title: t('admin.productionBasins'),
            value: currentStats.totalBasins,
            description: dashboardStats.basins
              ? t('admin.activeBasins', { count: dashboardStats.basins.active })
              : t('admin.basinsConfigured'),
            onClick: handleBasinClick,
            trend: dashboardStats.basins
              ? {
                  value: t('admin.trend.active', {
                    active: dashboardStats.basins.active,
                    total: dashboardStats.basins.total
                  }),
                  label: t('admin.trend.activeLabel'),
                }
              : undefined,
          },
        ]}
      />

      {/* Informations sur la campagne en cours */}
      {/* {currentStats.currentCampaign && (
        <AppContent title="Campagne en cours">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StatsCard
                title="Campagne active"
                value={currentStats.currentCampaign.name}
                description={`Du ${new Date(
                  currentStats.currentCampaign.startDate
                ).toLocaleDateString("fr-FR")} au ${new Date(
                  currentStats.currentCampaign.endDate
                ).toLocaleDateString("fr-FR")}`}
                onClick={handleCampaignClick}
              />
            </div>

            <div>
              <StatsCard
                title="Statut de la campagne"
                value={
                  currentStats.currentCampaign.status === "active"
                    ? "Active"
                    : "Inactive"
                }
                description="État actuel de la campagne"
                className={
                  currentStats.currentCampaign.status === "active"
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }
              />
            </div>
          </div>
        </AppContent>
      )} */}
    </div>
  );
}
