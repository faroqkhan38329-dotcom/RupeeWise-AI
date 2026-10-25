import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { RupeeWiseDashboard } from "@/components/rupeewise-dashboard";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <AppShell
      title="Overview"
      description="A clearer view of your money, at your own pace."
    >
      <PageHeading
        title="Your money, made clearer."
        description="Allowance, income, expenses and budgets in one view. Changes on any page are reflected here immediately."
      />
      <RupeeWiseDashboard />
    </AppShell>
  );
}
