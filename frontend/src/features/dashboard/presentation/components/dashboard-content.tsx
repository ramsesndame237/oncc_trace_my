"use client";

import { Icon } from "@/components/icon";
import { AppContent } from "@/components/layout/app-content";
import { StatsGrid } from "@/components/modules";
import { UserRole } from "@/core/domain/user-role.value-object";
import { useAuth } from "@/features/auth";
import { useTranslation } from "react-i18next";
import { AdminDashboard } from "./admin-dashboard";

export function DashboardContent() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();
  const userRole = user ? new UserRole(user.role) : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary p-3 rounded-lg">
            <Icon name="DashboardIcon" className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-sifc-primary">
              {t('dashboard:header.title')}
            </h1>
            <p className="text-gray-600">
              {t('dashboard:header.subtitle')}
            </p>
          </div>
        </div>

        {/* Welcome message */}
        <div className="bg-white rounded-lg shadow-sm border border-sifc-secondary/20 p-6">
          <h2 className="text-xl font-semibold text-sifc-primary mb-2">
            {t('dashboard:welcome.greeting', {
              firstName: user?.givenName,
              lastName: user?.familyName
            })}
          </h2>
          <p className="text-gray-600">
            {t('dashboard:welcome.role')} : {userRole?.getDisplayName()} • {t('dashboard:welcome.username', { username: user?.username })}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t('dashboard:welcome.lastLogin')} :{" "}
            {user?.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : t('dashboard:welcome.firstLogin')}
          </p>
        </div>
      </div>

      {/* Dashboard spécifique au rôle */}
      {userRole?.isTechnicalAdmin() ? (
        <AdminDashboard />
      ) : (
        <>
          {/* Statistiques de performance */}
          <StatsGrid
            title={t('dashboard:stats.title')}
            subtitle={t('dashboard:stats.subtitle', { date: '4 juillet 2025' })}
            onGlobalConsult={() => console.log("Consulter toutes les stats")}
            globalConsultText={t('dashboard:stats.consult')}
            stats={[
              {
                title: t('dashboard:basin.totalActorsZone'),
                value: 160,
                trend: {
                  value: "+2.84%",
                  isPositive: true,
                  label: "",
                },

                showConsultButton: false,
              },
              {
                title: t('dashboard:basin.totalActorsBasin'),
                value: "18T",
                trend: {
                  value: "+3.4%",
                  isPositive: true,
                  label: "",
                },
                showConsultButton: false,
              },
              {
                title: t('dashboard:basin.marketShare'),
                value: "721K",
                trend: {
                  value: "+11.02%",
                  isPositive: true,
                  label: "",
                },
                showConsultButton: false,
              },
              {
                title: t('dashboard:basin.totalProduction'),
                value: "721T",
                trend: {
                  value: "+11.02%",
                  isPositive: true,
                  label: "",
                },
                showConsultButton: false,
              },
            ]}
            className="mb-8"
          />

          {/* Quick Actions */}
          <AppContent title={t('dashboard:quickActions.title')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userRole?.canManageUsers() && (
                <button className="p-4 text-left border border-sifc-secondary/20 rounded-lg hover:bg-sifc-secondary/5 transition-colors">
                  <Icon
                    name="CustomUser"
                    className="h-6 w-6 text-primary mb-2"
                  />
                  <h4 className="font-medium text-primary">
                    {t('dashboard:quickActions.manageUsers')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('dashboard:quickActions.manageUsersDescription')}
                  </p>
                </button>
              )}

              {userRole?.canManageBasins() && (
                <button className="p-4 text-left border border-sifc-secondary/20 rounded-lg hover:bg-sifc-secondary/5 transition-colors">
                  <Icon
                    name="AgencyIcon"
                    className="h-6 w-6 text-primary mb-2"
                  />
                  <h4 className="font-medium text-primary">
                    {t('dashboard:quickActions.manageBasins')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('dashboard:quickActions.manageBasinsDescription')}
                  </p>
                </button>
              )}
            </div>
          </AppContent>
        </>
      )}
    </div>
  );
}
