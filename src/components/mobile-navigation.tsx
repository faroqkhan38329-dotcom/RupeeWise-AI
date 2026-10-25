"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  Activity,
  Goal,
  House,
  Menu,
  Plus,
  X,
  BarChart3,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { NavigationLinks } from "@/components/navigation";

const bottomItems = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/transactions", label: "Activity", icon: Activity },
  { href: "/goals", label: "Goals", icon: Goal },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function MobileNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <X size={19} aria-hidden="true" />
        ) : (
          <Menu size={19} aria-hidden="true" />
        )}
      </button>
      {isHydrated &&
        createPortal(
          <>
            {isOpen && (
              <>
                <button
                  type="button"
                  className="mobile-drawer-backdrop"
                  aria-label="Close navigation menu"
                  onClick={() => setIsOpen(false)}
                />
                <aside
                  id="mobile-navigation-drawer"
                  className="mobile-drawer"
                  aria-label="Mobile application navigation"
                >
                  <div className="mobile-drawer-top">
                    <Brand />
                    <button
                      type="button"
                      className="drawer-close"
                      aria-label="Close navigation menu"
                      onClick={() => setIsOpen(false)}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="sidebar-section-label">Workspace</p>
                  <NavigationLinks onNavigate={() => setIsOpen(false)} />
                </aside>
              </>
            )}
            <nav className="mobile-bottom-nav" aria-label="Quick navigation">
              {bottomItems.slice(0, 2).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className={`bottom-nav-link${pathname === href ? " bottom-nav-link-active" : ""}`}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
              <Link
                href="/transactions"
                className="quick-add-button"
                aria-label="Open transactions"
                title="Open transactions"
              >
                <Plus size={22} strokeWidth={2.4} aria-hidden="true" />
              </Link>
              <span className="bottom-nav-spacer" aria-hidden="true" />
              {bottomItems.slice(2).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className={`bottom-nav-link${pathname === href ? " bottom-nav-link-active" : ""}`}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </>,
          document.body,
        )}
    </>
  );
}
