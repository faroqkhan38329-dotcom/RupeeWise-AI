import { Lightbulb } from "lucide-react";
import { Brand } from "@/components/brand";
import { NavigationLinks } from "@/components/navigation";

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Application sidebar">
      <Brand />
      <p className="sidebar-section-label">Workspace</p>
      <NavigationLinks />
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <span>
            <Lightbulb
              size={12}
              aria-hidden="true"
              style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }}
            />
            A gentle reminder
          </span>
          <p>Small, steady steps can make money feel a little simpler.</p>
        </div>
      </div>
    </aside>
  );
}
