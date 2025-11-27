import { cn } from "@/lib/utils";

export function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 17 16"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-none stroke-current stroke-1", className)}
    >
      <path d="M6.31246 3.7526V0.210938M13.3958 3.7526V0.210938M16.2291 11.5443V14.7318H3.47913V12.6068M16.1321 5.52344H3.37429M1.35413 12.4297V12.6068H14.0333L14.1395 12.4297L14.3053 12.0819C15.5719 9.41976 16.2291 6.50874 16.2291 3.56065V1.98177H3.47913V3.4891C3.47915 6.45998 2.81176 9.39292 1.52625 12.0713L1.35413 12.4297Z" />
    </svg>
  );
}
