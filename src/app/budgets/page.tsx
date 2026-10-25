import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { BudgetsView } from "@/components/budgets-view";

export const metadata: Metadata = { title: "Category Budgets" };

export default function BudgetsPage() {
  return (
    <AppShell
      title="Category Budgets"
      description="Give your everyday spending a little more direction."
    >
      <PageHeading
        title="Limits that still feel flexible."
        description="Set a monthly limit for each category. Spending is calculated from your saved expense transactions."
      />
      <BudgetsView />
    </AppShell>
  );
}
