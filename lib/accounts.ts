// Account type labels and icons. Safe to use in client and server code.
import {
  BanknoteIcon,
  CreditCardIcon,
  LandmarkIcon,
  PiggyBankIcon,
  SmartphoneIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import type { AccountType } from "@/lib/generated/prisma/enums";

export const ACCOUNT_TYPES = [
  { value: "CASH", label: "Cash", icon: BanknoteIcon },
  { value: "BANK", label: "Bank", icon: LandmarkIcon },
  { value: "E_WALLET", label: "E-wallet", icon: SmartphoneIcon },
  { value: "SAVINGS", label: "Savings", icon: PiggyBankIcon },
  { value: "CREDIT_CARD", label: "Credit card", icon: CreditCardIcon },
  { value: "OTHER", label: "Other", icon: WalletIcon },
] as const satisfies readonly {
  value: AccountType;
  label: string;
  icon: LucideIcon;
}[];

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map((t) => t.value) as [
  AccountType,
  ...AccountType[],
];

export function accountTypeInfo(type: AccountType) {
  return ACCOUNT_TYPES.find((t) => t.value === type) ?? ACCOUNT_TYPES[5];
}
