import {
  Bus,
  Coffee,
  Film,
  GraduationCap,
  ReceiptText,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/finance";

type CategoryMeta = {
  icon: LucideIcon;
  color: string;
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: { icon: Coffee, color: "#10b981" },
  Transport: { icon: Bus, color: "#38bdf8" },
  Education: { icon: GraduationCap, color: "#8b5cf6" },
  Shopping: { icon: ShoppingBag, color: "#f472b6" },
  Entertainment: { icon: Film, color: "#f59e0b" },
  Bills: { icon: ReceiptText, color: "#06b6d4" },
  Other: { icon: Wallet, color: "#94a3b8" },
};
