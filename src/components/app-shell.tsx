import type { ReactNode } from "react";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <AppHeader title={title} description={description} />
        <main className="app-content">{children}</main>
      </div>
      <div className="app-footer-shell">
        <AppFooter />
      </div>
    </div>
  );
}
