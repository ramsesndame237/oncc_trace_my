"use client";

import React from "react";
import { TransactionList } from "../TransactionList";

export function SaleList() {
  return <TransactionList transactionType="SALE" />;
}
