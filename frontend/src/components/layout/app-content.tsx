"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import * as React from "react";
import { Heading } from "../modules/heading";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface ContentProps {
  children?: React.ReactNode;
  className?: string;
  title?: string | React.ReactNode;
  icon?: React.ReactNode;
  topActionButton?: React.ReactNode[];
  noPadding?: boolean;
  subtitle?: string;
  bottomActionButtons?: React.ReactNode[];
  bottomActionDirection?: "vertical" | "horizontal";
  bottomActionAlign?: "start" | "center" | "between" | "end";
  defautValue?: string;
  tabContent?: { title: string; key: string; content: React.ReactNode }[];
  listContent?: boolean;
}

export const AppContent = ({
  children,
  className,
  title,
  icon,
  topActionButton,
  noPadding,
  subtitle,
  bottomActionButtons,
  defautValue,
  bottomActionDirection = "horizontal",
  bottomActionAlign = "start",
  tabContent,
  listContent,
}: ContentProps) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const useMobile = useIsMobile();

  React.useEffect(() => {
    setIsMobile(useMobile);
  }, [useMobile]);

  return (
    <Card
      className={cn(
        " border-border !min-h-full overflow-hidden",
        className,
        listContent ? "lg:border border-border" : "border"
      )}
    >
      <CardHeader
        className={cn(
          "py-4 lg:py-3.5 lg:px-6 px-4",
          tabContent?.length ? "pb-1.5" : "border-b border-border"
        )}
      >
        <div className="flex items-center justify-between gap-x-6">
          {(icon || title || topActionButton) && (
            <div
              className={cn("flex items-center gap-x-6 justify-between w-full")}
            >
              <div className="flex items-center gap-x-4 min-w-0 flex-1">
                {icon}
                {typeof title === "string" ? (
                  <Heading as="h2" size="h2" className="truncate">
                    {title}
                  </Heading>
                ) : (
                  <div className="min-w-0 flex-1">{title}</div>
                )}
              </div>
              <div className="flex items-center gap-x-4">
                {topActionButton && (
                  <>
                    {isMobile ? (
                      <>
                        <div className="">
                          <Drawer>
                            <DrawerTrigger asChild>
                              <div className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </div>
                            </DrawerTrigger>
                            <DrawerContent>
                              <DrawerHeader>
                                <DrawerTitle>Actions</DrawerTitle>
                              </DrawerHeader>
                              <div className="flex flex-col py-6">
                                {topActionButton.map((button, index) => (
                                  <div
                                    key={index}
                                    className="p-2 flex flex-col items-stretch"
                                  >
                                    {button}
                                  </div>
                                ))}
                              </div>
                            </DrawerContent>
                          </Drawer>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-x-4">
                        {topActionButton.map((button, index) => (
                          <React.Fragment key={index}>{button}</React.Fragment>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {tabContent?.length && (
        <Tabs defaultValue={defautValue} className="w-full">
          <div className="w-full border-b border-border">
            <TabsList className="rounded-none bg-transparent justify-start pb-0 h-auto lg:px-6 px-4 overflow-x-auto">
              {tabContent.map((item, index) => {
                return (
                  <TabsTrigger
                    className="text-foreground cursor-pointer data-[state=active]:cursor-default border-0 border-b lg:pb-2 pb-3 px-4 border-transparent rounded-none data-[state=active]:!border-primary data-[state=active]:!bg-white data-[state=active]:!text-primary data-[state=active]:shadow-none"
                    value={item.key}
                    key={index}
                  >
                    {item.title}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          <CardContent
            className={cn(
              "flex-grow py-6 lg:px-8 px-6 gap-12",
              noPadding && "!p-0"
            )}
          >
            {tabContent.map((item, index) => {
              return (
                <TabsContent value={item.key} key={index}>
                  {item.content}
                </TabsContent>
              );
            })}
          </CardContent>
        </Tabs>
      )}

      {!tabContent && (
        <CardContent
          className={cn(
            "space-y-4 flex-grow lg:py-6 py-4 lg:px-7 px-4 gap-12",
            noPadding && "!p-0",
            listContent && "lg:px-7 px-0 lg:bg-transparent bg-[#F9F9F9]"
          )}
        >
          {subtitle && <div className="pb-6 text-gray-500">{subtitle}</div>}
          {children && (
            <div className="text-foreground text-base font-normal">
              {children}
            </div>
          )}
        </CardContent>
      )}
      {bottomActionButtons && !tabContent && (
        <CardFooter
          className={cn("py-6 lg:px-7 px-4")}
          orientation={bottomActionDirection}
          align={bottomActionAlign}
        >
          {bottomActionButtons}
        </CardFooter>
      )}
    </Card>
  );
};
