"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

// Remembers the accounts last used in the transaction form, so a quick entry
// is just the amount. Saved in this browser's localStorage.

type TransactionFormState = {
  lastAccountId: { EXPENSE?: string; INCOME?: string };
  lastTransfer?: { fromAccountId: string; toAccountId: string };
  rememberAccount: (type: "EXPENSE" | "INCOME", accountId: string) => void;
  rememberTransfer: (fromAccountId: string, toAccountId: string) => void;
};

function createTransactionFormStore() {
  return createStore<TransactionFormState>()(
    persist(
      (set) => ({
        lastAccountId: {},
        rememberAccount: (type, accountId) =>
          set((state) => ({
            lastAccountId: { ...state.lastAccountId, [type]: accountId },
          })),
        rememberTransfer: (fromAccountId, toAccountId) =>
          set({ lastTransfer: { fromAccountId, toAccountId } }),
      }),
      {
        name: "transaction-form",
        // Read localStorage after mounting, never during server rendering.
        skipHydration: true,
      },
    ),
  );
}

type Store = ReturnType<typeof createTransactionFormStore>;

const StoreContext = createContext<Store | null>(null);

// One store per provider (so per request on the server), per Zustand's
// Next.js guidance: never a module-level store.
export function TransactionFormStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [store] = useState(createTransactionFormStore);

  useEffect(() => {
    void store.persist.rehydrate();
  }, [store]);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useTransactionFormStore<T>(
  selector: (state: TransactionFormState) => T,
): T {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(
      "useTransactionFormStore must be used inside TransactionFormStoreProvider",
    );
  }
  return useStore(store, selector);
}
