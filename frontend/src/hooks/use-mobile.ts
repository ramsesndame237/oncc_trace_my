"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 912;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Initialiser directement avec la bonne valeur pour éviter le délai
    if (typeof window === "undefined") return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const onChange = () => {
      const newIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      console.log("📱 useIsMobile:", {
        width: window.innerWidth,
        isMobile: newIsMobile,
        threshold: `<= ${MOBILE_BREAKPOINT}px`,
      });
      setIsMobile(newIsMobile);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
