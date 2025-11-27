import { cn } from "@/lib/utils";
import * as icons from "./allIcons";

export type IconName = keyof typeof icons;

export interface IconProps {
  name: IconName;
  className?: string;
}

const Icon = ({ name, className }: IconProps) => {
  const IconComponent = icons[name] as React.ComponentType<{
    className?: string;
  }>;
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  return <IconComponent className={cn("size-5", className)} />;
};

export { Icon };
