"use client";

import { SaleProductsEditForm } from "@/features/transaction/presentation/components/Sale/Edit/SaleProductsEditForm";
import { Suspense } from "react";

export default function SaleEditProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SaleProductsEditForm />
    </Suspense>
  );
}
