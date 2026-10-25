"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type AppHeaderProps = {
  title: string;
  description: string;
};

type MonthOption = {
  value: string;
  label: string;
};

const months: MonthOption[] = Array.from({ length: 12 }, (_, index) => ({
  value: `month-${index}`,
  label:
    index === 0
      ? "This month"
      : index === 1
        ? "Last month"
        : `${index} months ago`,
}));

export function AppHeader({ title, description }: AppHeaderProps) {
  const [selectedMonth, setSelectedMonth] = useState("month-0");

  return (
    <header className="app-header">
      <MobileNavigation />
      <div className="app-header-title">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="app-header-actions">
        <label className="month-select-wrap" aria-label="Select month">
          <CalendarDays size={15} aria-hidden="true" />
          <select
            className="month-select"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            aria-label="Select month"
          >
            {months.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
        <ThemeToggle />
        <Link
          href="/transactions"
          className="button button-primary header-add-button"
          aria-label="Open transactions"
        >
          <Plus size={16} aria-hidden="true" />
          Add entry
        </Link>
      </div>
    </header>
  );
}
