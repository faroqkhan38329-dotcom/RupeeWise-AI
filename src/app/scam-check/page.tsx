import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { ScamCheckView } from "@/components/scam-check-view";
import { isAiProviderConfigured } from "@/lib/ai-provider";

export const metadata: Metadata = { title: "Scam Check" };

async function ScamCheckExperience() {
  await connection();
  const providerConfigured = isAiProviderConfigured();

  return <ScamCheckView providerConfigured={providerConfigured} />;
}

function ScamCheckLoading() {
  return (
    <div className="stage5-stack" aria-busy="true">
      <p className="sr-only" role="status">
        Loading Scam Check…
      </p>
      <div className="skeleton stage5-banner-skeleton" />
      <div className="scam-layout">
        <div className="panel skeleton stage5-chat-skeleton" />
        <div className="panel skeleton stage5-side-skeleton" />
      </div>
    </div>
  );
}

export default function ScamCheckPage() {
  return (
    <AppShell
      title="Scam Check"
      description="Slow down and inspect suspicious money messages."
    >
      <PageHeading
        title="Pause before you trust it."
        description="Paste a suspicious SMS, email or payment request. Transparent demo rules highlight common warning signs, and you stay in control of any optional AI analysis."
      />
      <Suspense fallback={<ScamCheckLoading />}>
        <ScamCheckExperience />
      </Suspense>
    </AppShell>
  );
}
