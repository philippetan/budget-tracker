// Category icons, colours and the starter set. Safe for client and server code.
import {
  BabyIcon,
  BadgePercentIcon,
  BanknoteIcon,
  BikeIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BusIcon,
  CarIcon,
  ChurchIcon,
  CircleEllipsisIcon,
  ClapperboardIcon,
  CoffeeIcon,
  CreditCardIcon,
  DropletIcon,
  DumbbellIcon,
  FuelIcon,
  Gamepad2Icon,
  GiftIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HandHeartIcon,
  HeartPulseIcon,
  HouseIcon,
  LandmarkIcon,
  LaptopIcon,
  MusicIcon,
  PartyPopperIcon,
  PawPrintIcon,
  PiggyBankIcon,
  PillIcon,
  PizzaIcon,
  PlaneIcon,
  ReceiptIcon,
  ScissorsIcon,
  ShieldIcon,
  ShirtIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  SparklesIcon,
  StethoscopeIcon,
  StoreIcon,
  TagIcon,
  TrainFrontIcon,
  TrendingUpIcon,
  TvIcon,
  UtensilsIcon,
  WalletIcon,
  WifiIcon,
  WrenchIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";

import type { TransactionType } from "@/lib/generated/prisma/enums";

/**
 * Icons offered in the picker, keyed by the lucide name stored in the database.
 * To offer another icon, add it here (no migration needed).
 */
export const CATEGORY_ICONS = {
  // Food & shopping
  utensils: UtensilsIcon,
  coffee: CoffeeIcon,
  pizza: PizzaIcon,
  "shopping-cart": ShoppingCartIcon,
  "shopping-bag": ShoppingBagIcon,
  shirt: ShirtIcon,
  // Transport
  bus: BusIcon,
  car: CarIcon,
  fuel: FuelIcon,
  "train-front": TrainFrontIcon,
  bike: BikeIcon,
  plane: PlaneIcon,
  // Home & bills
  house: HouseIcon,
  receipt: ReceiptIcon,
  zap: ZapIcon,
  droplet: DropletIcon,
  wifi: WifiIcon,
  smartphone: SmartphoneIcon,
  wrench: WrenchIcon,
  // Health & personal
  "heart-pulse": HeartPulseIcon,
  pill: PillIcon,
  stethoscope: StethoscopeIcon,
  dumbbell: DumbbellIcon,
  scissors: ScissorsIcon,
  shield: ShieldIcon,
  // Fun & family
  clapperboard: ClapperboardIcon,
  "gamepad-2": Gamepad2Icon,
  music: MusicIcon,
  tv: TvIcon,
  "party-popper": PartyPopperIcon,
  "book-open": BookOpenIcon,
  "graduation-cap": GraduationCapIcon,
  baby: BabyIcon,
  "paw-print": PawPrintIcon,
  gift: GiftIcon,
  "hand-heart": HandHeartIcon,
  church: ChurchIcon,
  sparkles: SparklesIcon,
  // Money
  "badge-percent": BadgePercentIcon,
  "credit-card": CreditCardIcon,
  landmark: LandmarkIcon,
  "piggy-bank": PiggyBankIcon,
  banknote: BanknoteIcon,
  wallet: WalletIcon,
  "hand-coins": HandCoinsIcon,
  "trending-up": TrendingUpIcon,
  briefcase: BriefcaseIcon,
  laptop: LaptopIcon,
  store: StoreIcon,
  // General
  tag: TagIcon,
  "circle-ellipsis": CircleEllipsisIcon,
} satisfies Record<string, LucideIcon>;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS) as [
  CategoryIconName,
  ...CategoryIconName[],
];

export function categoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name as CategoryIconName] ?? TagIcon;
}

/** Colours offered in the picker (hex, as stored in the database). */
export const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
] as const;

export const DEFAULT_CATEGORY_COLOR = "#64748b";

export const TRANSACTION_TYPES = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
] as const satisfies readonly { value: TransactionType; label: string }[];

/** Categories every new user starts with. */
export const STARTER_CATEGORIES: {
  name: string;
  type: TransactionType;
  icon: CategoryIconName;
  color: string;
}[] = [
  { type: "EXPENSE", name: "Food & Dining", icon: "utensils", color: "#f97316" },
  { type: "EXPENSE", name: "Groceries", icon: "shopping-cart", color: "#84cc16" },
  { type: "EXPENSE", name: "Transportation", icon: "bus", color: "#3b82f6" },
  { type: "EXPENSE", name: "Bills & Utilities", icon: "receipt", color: "#f59e0b" },
  { type: "EXPENSE", name: "Load & Internet", icon: "smartphone", color: "#06b6d4" },
  { type: "EXPENSE", name: "Shopping", icon: "shopping-bag", color: "#ec4899" },
  { type: "EXPENSE", name: "Health", icon: "heart-pulse", color: "#ef4444" },
  { type: "EXPENSE", name: "Entertainment", icon: "clapperboard", color: "#a855f7" },
  { type: "EXPENSE", name: "Education", icon: "graduation-cap", color: "#6366f1" },
  { type: "EXPENSE", name: "Fees", icon: "badge-percent", color: "#64748b" },
  { type: "EXPENSE", name: "Other", icon: "circle-ellipsis", color: "#64748b" },
  { type: "INCOME", name: "Salary", icon: "briefcase", color: "#22c55e" },
  { type: "INCOME", name: "Freelance", icon: "laptop", color: "#14b8a6" },
  { type: "INCOME", name: "Business", icon: "store", color: "#3b82f6" },
  { type: "INCOME", name: "Gifts", icon: "gift", color: "#ec4899" },
  { type: "INCOME", name: "Other Income", icon: "hand-coins", color: "#64748b" },
];
