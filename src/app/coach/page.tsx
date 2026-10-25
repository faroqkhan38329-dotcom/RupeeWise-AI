import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { CoachView } from "@/components/coach-view";
import { PageHeading } from "@/components/page-heading";
import { isAiProviderConfigured } from "@/lib/ai-provider";

export const metadata: Metadata = { title: "AI Money Coach" };

async function CoachExperience() {
  await connection();
  const providerConfigured = isAiProviderConfigured();

  return <CoachView providerConfigured={providerConfigured} />;
}

function CoachLoading() {
  return (
    <div className="stage5-stack" aria-busy="true">
      <p className="sr-only" role="status">
        Loading the money coach…
      </p>
      <div className="skeleton stage5-banner-skeleton" />
      <div className="coach-layout">
        <div className="panel skeleton stage5-chat-skeleton" />
        <div className="stage5-side">
          <div className="panel skeleton stage5-side-skeleton" />
          <div className="panel skeleton stage5-side-skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <AppShell
      title="AI Money Coach"
      description="Practical money guidance, with every figure explained."
    >
      <PageHeading
        title="A calmer money conversation."
        description="Ask about allowances, food spending, budgets or savings. Answers use the summaries saved in this browser and are always labelled rule-based or AI-assisted."
      />
      <Suspense fallback={<CoachLoading />}>
        <CoachExperience />
      </Suspense>
    </AppShell>
  );
}
