"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { USER_ROLES_CONSTANTS } from "@/core/domain/generated/user-roles.types";
import { useAuth } from "@/features/auth";
import { useOutboxCount } from "@/features/outbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { appConfig } from "@/lib/config";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Icon, IconName } from "../icon";

interface NavigationItem {
  title: string;
  icon?: React.ComponentType<{ className?: string }> | IconName;
  url?: string;
  active?: boolean;
  roles?: string[];
  actorTypes?: string[];
  items?: NavigationItem[];
  count?: number;
}

interface NavigationGroup {
  title?: string;
  count?: number;
  items: NavigationItem[];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { count: outboxCount } = useOutboxCount();
  const { t } = useTranslation("common");
  const { setOpenMobile } = useSidebar();

  // Fonction pour fermer le sidebar après un clic en mode mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Navigation items basés sur le rôle
  const navigationItems: NavigationGroup[] = [
    {
      items: [
        {
          title: t("navigation.dashboard"),
          icon: "DashboardIcon" as IconName,
          url: "/dashboard",
          active: pathname.startsWith("/dashboard"),
          roles: [
            USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
            USER_ROLES_CONSTANTS.FIELD_AGENT,
            USER_ROLES_CONSTANTS.ACTOR_MANAGER,
          ],
          actorTypes: ["PRODUCERS", "BUYER", "EXPORTER", "TRANSFORMER"],
        },
        {
          title: t("navigation.calendars"),
          icon: "IconCalendar" as IconName,
          url: "/calendars",
          active: pathname.startsWith("/calendars"),
          roles: [
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
            USER_ROLES_CONSTANTS.FIELD_AGENT,
            USER_ROLES_CONSTANTS.ACTOR_MANAGER,
          ],
          actorTypes: ["PRODUCERS", "BUYER", "EXPORTER", "TRANSFORMER"],
        },
        {
          title: t("navigation.productTransfers"),
          icon: "TransfertIcon" as IconName,
          url: "/product-transfers",
          active: pathname.startsWith("/product-transfers"),
          roles: [
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
            USER_ROLES_CONSTANTS.FIELD_AGENT,
            USER_ROLES_CONSTANTS.ACTOR_MANAGER,
          ],
          actorTypes: ["PRODUCERS", "BUYER", "EXPORTER"],
        },
        {
          title: t("navigation.transactions"),
          icon: "TransactionIcon" as IconName,
          url: "/transactions",
          active: pathname.startsWith("/transactions"),
          roles: [
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
            USER_ROLES_CONSTANTS.FIELD_AGENT,
            USER_ROLES_CONSTANTS.ACTOR_MANAGER,
          ],
          actorTypes: ["PRODUCERS", "BUYER", "EXPORTER", "TRANSFORMER"],
        },
        {
          title: t("navigation.conventions"),
          icon: "ConventionIcon" as IconName,
          url: "/conventions",
          active: pathname.startsWith("/conventions"),
          roles: [
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
            USER_ROLES_CONSTANTS.ACTOR_MANAGER,
            USER_ROLES_CONSTANTS.FIELD_AGENT,
          ],
          actorTypes: ["BUYER", "PRODUCERS", "EXPORTER"],
        },
      ],
    },
    {
      items: [
        {
          title: t("navigation.outbox"),
          icon: "Send" as IconName,
          url: "/outbox",
          active: pathname.startsWith("/outbox"),
          count: outboxCount,
          roles: [
            USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
            USER_ROLES_CONSTANTS.FIELD_AGENT,
            USER_ROLES_CONSTANTS.ACTOR_MANAGER,
          ],
          actorTypes: ["PRODUCERS", "BUYER", "EXPORTER", "TRANSFORMER"],
        },
      ],
    },
    {
      items: [
        {
          title: t("navigation.production"),
          icon: "ProductionIcon" as IconName,
          items: [
            {
              title: t("navigation.producers"),
              icon: "ProducerIcon" as IconName,
              url: "/actors/producer",
              active:
                pathname.startsWith("/actors/producer") &&
                !pathname.startsWith("/actors/producers"),
              roles: [
                USER_ROLES_CONSTANTS.BASIN_ADMIN,
                USER_ROLES_CONSTANTS.FIELD_AGENT,
              ],
            },
            {
              title: t("navigation.opa"),
              icon: "OpaIcon" as IconName,
              url: "/actors/producers",
              active: pathname.startsWith("/actors/producers"),
              roles: [
                USER_ROLES_CONSTANTS.BASIN_ADMIN,
                USER_ROLES_CONSTANTS.FIELD_AGENT,
              ],
            },
            {
              title: t("navigation.buyers"),
              icon: "BuyerIcon" as IconName,
              url: "/actors/buyers",
              active: pathname.startsWith("/actors/buyers"),
              roles: [
                USER_ROLES_CONSTANTS.BASIN_ADMIN,
                USER_ROLES_CONSTANTS.FIELD_AGENT,
              ],
            },
            {
              title: t("navigation.exporters"),
              icon: "ExporterIcon" as IconName,
              url: "/actors/exporters",
              active: pathname.startsWith("/actors/exporters"),
              roles: [
                USER_ROLES_CONSTANTS.BASIN_ADMIN,
                USER_ROLES_CONSTANTS.FIELD_AGENT,
              ],
            },
            {
              title: t("navigation.transformers"),
              icon: "TransformerIcon" as IconName,
              url: "/actors/transformers",
              active: pathname.startsWith("/actors/transformers"),
              roles: [
                USER_ROLES_CONSTANTS.BASIN_ADMIN,
                USER_ROLES_CONSTANTS.FIELD_AGENT,
              ],
            },
          ],
        },
        {
          title: t("navigation.myProducers"),
          icon: "ProducerIcon" as IconName,
          url: "/my-producers",
          active: pathname.startsWith("/my-producers"),
          roles: [USER_ROLES_CONSTANTS.ACTOR_MANAGER],
          actorTypes: ["PRODUCERS"],
        },
        {
          title: t("navigation.myBuyers"),
          icon: "BuyerIcon" as IconName,
          url: "/my-buyers",
          active: pathname.startsWith("/my-buyers"),
          roles: [USER_ROLES_CONSTANTS.ACTOR_MANAGER],
          actorTypes: ["EXPORTER"],
        },
        {
          title: t("navigation.stores"),
          icon: "CustomWareHouse" as IconName,
          url: "/stores",
          active: pathname.startsWith("/stores"),
          roles: [
            USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
            USER_ROLES_CONSTANTS.ACTOR_MANAGER,
            USER_ROLES_CONSTANTS.FIELD_AGENT,
          ],
          actorTypes: ["PRODUCERS", "BUYER", "EXPORTER", "TRANSFORMER"],
        },
        {
          title: t("navigation.users"),
          icon: "UsersIcon" as IconName,
          url: "/users",
          active: pathname.startsWith("/users"),
          roles: [
            USER_ROLES_CONSTANTS.TECHNICAL_ADMIN,
            USER_ROLES_CONSTANTS.BASIN_ADMIN,
          ],
        },
      ],
    },
    {
      items: [
        {
          title: t("navigation.settings"),
          icon: "SettingIcon" as IconName,
          items: [
            {
              title: t("navigation.campaigns"),
              icon: "CampaignIcon" as IconName,
              url: "/campaign",
              active: pathname.startsWith("/campaign"),
              roles: [USER_ROLES_CONSTANTS.TECHNICAL_ADMIN],
            },
            {
              title: t("navigation.productionBasins"),
              icon: "AgencyIcon" as IconName,
              url: "/production-basin",
              active: pathname.startsWith("/production-basin"),
              roles: [USER_ROLES_CONSTANTS.TECHNICAL_ADMIN],
            },
            {
              title: t("navigation.locations"),
              icon: "MapIcon" as IconName,
              url: "/locations",
              active: pathname.startsWith("/locations"),
              roles: [USER_ROLES_CONSTANTS.TECHNICAL_ADMIN],
            },
          ],
        },
      ],
    },
  ];

  // Fonction pour vérifier si un item est accessible
  const hasAccess = (item: NavigationItem): boolean => {
    if (!item.roles || !user) return false;

    const userHasRequiredRole = item.roles.includes(
      user.role as (typeof item.roles)[number]
    );

    if (!userHasRequiredRole) {
      return false;
    }

    // Si le rôle est ACTOR_MANAGER, vérifier le type d'acteur
    if (user.role === USER_ROLES_CONSTANTS.ACTOR_MANAGER) {
      if (!item.actorTypes || item.actorTypes.length === 0) {
        // Si l'item n'a pas de restriction de type, on l'autorise pour ce rôle
        return true;
      }
      // Vérifier si le type de l'acteur de l'utilisateur est dans la liste autorisée
      return (
        !!user.actor?.actorType &&
        item.actorTypes.includes(user.actor.actorType)
      );
    }

    return true; // Pour les autres rôles, la vérification du rôle suffit
  };

  // Fonction pour filtrer et enlever les items qui n'appartiennent pas aux rôles de l'utilisateur
  const getFilteredItems = (): NavigationGroup[] => {
    return navigationItems
      .map((group) => ({
        ...group,
        items: group.items
          .map((item) => {
            if (item.items) {
              // Pour les items avec sous-items, on filtre les sous-items
              return {
                ...item,
                items: item.items.filter((subItem) => hasAccess(subItem)),
              };
            }
            return item;
          })
          .filter((item) => {
            // On garde l'item si il a accès direct OU si il a des sous-items accessibles
            return hasAccess(item) || (item.items && item.items.length > 0);
          }),
      }))
      .filter((group) => group.items.length > 0);
  };

  const filteredItems = getFilteredItems();

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className={
        !isMobile
          ? "border-r border-border min-h-screen sticky top-0 max-w-64 w-64"
          : ""
      }
      {...props}
    >
      <SidebarHeader className="border-b border-sifc-secondary/20 px-3 py-2">
        <div className="flex items-center gap-x-3 min-w-0">
          <div className="shrink-0">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow text-sidebar-primary-foreground">
              <Image src="/logo/logo.png" alt="logo" width={32} height={32} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-primary truncate">
              {appConfig.name}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {t("app.version", { version: appConfig.version })}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredItems.map((group, index) => {
          return (
            <React.Fragment key={`${group.title}-${index}`}>
              {index > 0 && <SidebarSeparator />}
              <SidebarGroup>
                <SidebarMenu>
                  {group.items.map((item, index) => {
                    if (item.items?.length) {
                      return (
                        <React.Fragment key={`${item.title}-${index}`}>
                          <Collapsible
                            asChild
                            defaultOpen={item.items?.some(
                              (menu) => menu.active
                            )}
                            className="group/collapsible"
                            defaultValue={
                              item.items.some((menu) => menu.active)
                                ? item.title
                                : undefined
                            }
                          >
                            <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                  size={"lg"}
                                  className="cursor-pointer w-full min-w-0"
                                  isActive={item.items?.some(
                                    (menu) => menu.active
                                  )}
                                >
                                  <span className="flex items-center gap-x-2 min-w-0 flex-1">
                                    {item.icon && (
                                      <Icon
                                        name={item.icon as IconName}
                                        className="shrink-0"
                                      />
                                    )}
                                    <span className="truncate">
                                      {item.title}
                                    </span>
                                  </span>
                                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-2">
                                <SidebarMenuSub className="border-0 space-y-1 px-0">
                                  {item.items?.map((subItem, subIndex) => (
                                    <SidebarMenuSubItem key={subIndex}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={subItem.active}
                                        className="h-10 data-[active=true]:[&>svg]:text-sidebar-accent-foreground"
                                      >
                                        <Link
                                          href={subItem.url || "#"}
                                          className="flex items-center justify-between min-w-0"
                                          onClick={handleLinkClick}
                                        >
                                          <span className="flex items-center gap-x-2 min-w-0 flex-1">
                                            {subItem.icon && (
                                              <Icon
                                                name={subItem.icon as IconName}
                                                className="shrink-0"
                                              />
                                            )}
                                            <span className="truncate">
                                              {subItem.title}
                                            </span>
                                          </span>
                                          {subItem.count !== undefined &&
                                            subItem.count >= 1 && (
                                              <span className="ml-auto !bg-black text-white text-xs px-2 py-1 rounded-full shrink-0">
                                                {subItem.count}
                                              </span>
                                            )}
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuItem>
                          </Collapsible>
                        </React.Fragment>
                      );
                    }

                    return (
                      <SidebarMenuItem key={`${item.title}-${index}`}>
                        <SidebarMenuButton
                          size="lg"
                          asChild
                          isActive={item.active}
                        >
                          <Link
                            href={item.url || "#"}
                            className="flex items-center justify-between min-w-0"
                            onClick={handleLinkClick}
                          >
                            <span className="flex items-center gap-x-2 min-w-0 flex-1">
                              {item.icon && (
                                <Icon
                                  name={item.icon as IconName}
                                  className="shrink-0"
                                />
                              )}
                              <span className="truncate">{item.title}</span>
                            </span>

                            {item.count !== undefined && item.count > 0 && (
                              <span className="ml-auto !bg-black text-white text-xs px-2 py-1 rounded-full shrink-0">
                                {item.count}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            </React.Fragment>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
