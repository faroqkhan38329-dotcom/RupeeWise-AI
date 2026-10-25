import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/page-heading";
import { TransactionsView } from "@/components/transactions-view";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <AppShell
      title="Transactions"
      description="Income and expenses, in one calm place."
    >
      <PageHeading
        title="Every entry, in one place."
        description="Add income and expenses, then search, filter and sort them. Entries are saved only in this browser."
      />
      <TransactionsView />
    </AppShell>
  );
}
