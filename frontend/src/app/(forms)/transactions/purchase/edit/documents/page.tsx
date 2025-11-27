import { PurchaseDocumentsEditForm } from "@/features/transaction/presentation/components/Purchase/Edit/PurchaseDocumentsEditForm";
import { Suspense } from "react";

export default function PurchaseEditDocumentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseDocumentsEditForm />
    </Suspense>
  );
}
