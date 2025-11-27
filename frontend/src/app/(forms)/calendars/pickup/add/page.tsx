"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PickupAddPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la première étape
    router.replace("/calendars/pickup/create/informations");
  }, [router]);

  return null;
}
