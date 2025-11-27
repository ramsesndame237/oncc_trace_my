"use client";
import { UserRole } from "@/core/domain/user-role.value-object";
import { useAuth } from "@/features/auth";
import { usePinAuth } from "@/features/pin/presentation/hooks/usePinAuth";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../icon";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";

export const AppUser = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const { clearSession } = usePinAuth();
  const userRole = user ? new UserRole(user.role) : null;
  const { t } = useTranslation("common");

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleLockSession = () => {
    clearSession();
    setIsOpen(false);
  };

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 data-[state=open]:bg-transparent bg-transparent hover:bg-transparent flex items-center"
          >
            <Avatar className="size-8">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-48 overflow-hidden rounded-none rounded-b-md p-0 lg:mt-2 mt-1.5"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarHeader className="bg-white border-b border-border">
              <div className="flex flex-col space-y-2 pb-2">
                <p className={"text-sm capitalize"}>
                  {user?.givenName} {user?.familyName}
                </p>
                <p className={"text-xs truncate font-medium leading-none"}>
                  @{user?.username}
                </p>
                <sub className="text-xs leading-none text-muted-foreground">
                  {user?.position || userRole?.getDisplayName()}
                </sub>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-1">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" className="cursor-pointer" asChild>
                    <Link href="/preferences">
                      <Icon
                        name="Settings"
                        className="size-4 hover:text-primary"
                      />
                      <span>{t("navigation.preferences")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="sm"
                    onClick={handleLockSession}
                    className="cursor-pointer"
                  >
                    <Icon name="Lock" className="size-4 hover:text-primary" />
                    <span>{t("navigation.lockSession")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="sm"
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <Icon name="LogOut" className="size-4 hover:text-primary" />
                    <span>{t("navigation.logout")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  );
};
