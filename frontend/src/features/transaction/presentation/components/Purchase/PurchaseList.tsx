"use client";

import React from "react";
import { TransactionList } from "../TransactionList";

export function PurchaseList() {
  return <TransactionList transactionType="PURCHASE" />;
}
