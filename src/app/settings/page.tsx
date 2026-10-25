import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Make RupeeWise feel a little more like your space."
      icon={Settings}
      featureDescription="Profile and app preferences are planned for a later development stage. Theme switching is available in the header."
    />
  );
}
