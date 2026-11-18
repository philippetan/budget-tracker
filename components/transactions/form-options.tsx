"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { TransactionFormOptions } from "@/lib/data/transactions";

// Accounts and categories for the transaction form, loaded once per page
// and shared by the "Add" button and every row's Edit menu.
const FormOptionsContext = createContext<TransactionFormOptions | null>(null);

export function TransactionFormOptionsProvider({
  options,
  children,
}: {
  options: TransactionFormOptions;
  children: ReactNode;
}) {
  return (
    <FormOptionsContext.Provider value={options}>
      {children}
    </FormOptionsContext.Provider>
  );
}

export function useTransactionFormOptions(): TransactionFormOptions {
  const options = useContext(FormOptionsContext);
  if (!options) {
    throw new Error(
      "useTransactionFormOptions must be used inside TransactionFormOptionsProvider",
    );
  }
  return options;
}
