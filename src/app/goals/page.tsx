import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { SavingsGoalsView } from "@/components/savings-goals-view";

export const metadata: Metadata = { title: "Savings Goals" };

export default function GoalsPage() {
  return (
    <AppShell
      title="Savings Goals"
      description="Make room for the plans and little treats that matter to you."
    >
      <PageHeading
        title="Small steps toward something yours."
        description="Set a target, record what you have saved and see the remaining amount. Goals are a plan kept in this browser, not a bank account."
      />
      <SavingsGoalsView />
    </AppShell>
  );
}
