import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import type { LucideIcon } from "lucide-react";

type ComingSoonProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  featureDescription: string;
};

export function ComingSoon({
  title,
  description,
  icon,
  featureDescription,
}: ComingSoonProps) {
  return (
    <AppShell title={title} description={description}>
      <PageHeading
        title={title}
        description="A simple, thoughtful way to make your money feel easier to understand."
      />
      <EmptyState
        icon={icon}
        title="Coming in a later development stage"
        description={`${featureDescription} This feature is not active yet, and no financial results are being shown.`}
        actionLabel="Back to overview"
        actionHref="/dashboard"
      />
    </AppShell>
  );
}
