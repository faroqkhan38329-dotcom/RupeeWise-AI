import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { InsightsView } from "@/components/insights-view";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <AppShell
      title="Insights"
      description="Find useful patterns in your everyday money habits."
    >
      <PageHeading
        title="Patterns you can actually use."
        description="Review recorded income, expenses and budget progress for a selected period, then test one purchase with the affordability calculator."
      />
      <InsightsView />
    </AppShell>
  );
}
