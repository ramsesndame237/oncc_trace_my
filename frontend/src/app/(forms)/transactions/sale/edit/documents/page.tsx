import { SaleDocumentsEditForm } from "@/features/transaction/presentation/components/Sale/Edit/SaleDocumentsEditForm";
import { Suspense } from "react";

export default function SaleEditDocumentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SaleDocumentsEditForm />
    </Suspense>
  );
}
