"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownUp,
  CalendarRange,
  CheckCircle2,
  Gauge,
  Info,
  PieChart,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AffordabilityCalculator } from "@/components/affordability-calculator";
import { CATEGORY_META } from "@/components/category-meta";
import { DataNotice } from "@/components/data-notice";
import { MetricCard } from "@/components/metric-card";
import {
  formatINR,
  formatMonthLabel,
  getAvailableMonthKeys,
  getBudgetProgress,
  getMonthKey,
  getPreviousMonthKey,
  roundAmount,
  sumByCategory,
  sumExpenses,
  sumIncome,
} from "@/lib/finance";
import type {
  BudgetProgress,
  Category,
  Transaction,
} from "@/lib/finance";
import { useFinanceStore } from "@/lib/finance-store";

type Insight = {
  tone: "warning" | "success" | "info";
  message: string;
};

const INSIGHT_ICONS: Record<Insight["tone"], LucideIcon> = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

function transactionsForMonth(
  transactions: Transaction[],
  monthKey: string,
): Transaction[] {
  return transactions.filter(
    (transaction) => getMonthKey(transaction.date) === monthKey,
  );
}

function describeChange(
  current: number,
  previous: number,
  noun: string,
  previousLabel: string,
): string {
  const delta = roundAmount(current - previous);
  const verb = noun === "Income" ? "was" : "were";

  if (delta === 0) {
    return `${noun} ${verb} the same as ${previousLabel} (${formatINR(previous)}).`;
  }

  const direction = delta > 0 ? "higher" : "lower";
  const percent =
    previous > 0
      ? ` (${Math.abs(Math.round((delta / previous) * 100))}%)`
      : "";

  return `${noun} ${verb} ${formatINR(Math.abs(delta))} ${direction} than ${previousLabel} (${formatINR(
    previous,
  )})${percent}.`;
}

export function InsightsView() {
  const { data, hydrated } = useFinanceStore();
  const periodId = useId();
  const [requestedPeriod, setRequestedPeriod] = useState("");

  const { transactions, budgets } = data;
  const months = useMemo(
    () => getAvailableMonthKeys(transactions),
    [transactions],
  );
  const activePeriod =
    requestedPeriod === "all" ||
    (requestedPeriod && months.includes(requestedPeriod))
      ? requestedPeriod
      : (months[0] ?? "all");

  const periodTransactions = useMemo(
    () =>
      activePeriod === "all"
        ? transactions
        : transactionsForMonth(transactions, activePeriod),
    [activePeriod, transactions],
  );
  const periodIncome = sumIncome(periodTransactions);
  const periodExpenses = sumExpenses(periodTransactions);
  const periodNet = roundAmount(periodIncome - periodExpenses);
  const periodLabel =
    activePeriod === "all"
      ? "All saved transactions"
      : formatMonthLabel(activePeriod);

  const categorySpending = useMemo(
    () => sumByCategory(periodTransactions),
    [periodTransactions],
  );
  const categoryRows = useMemo(
    () =>
      (Object.entries(categorySpending) as [Category, number][])
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([category, value]) => ({
          category,
          value,
          percent:
            periodExpenses > 0 ? (value / periodExpenses) * 100 : 0,
        })),
    [categorySpending, periodExpenses],
  );
  const highest = categoryRows[0] ?? null;

  const budgetProgress = useMemo(
    () => getBudgetProgress(budgets, transactions),
    [budgets, transactions],
  );
  const budgetWatch = budgetProgress.filter(
    (item) => item.status === "over" || item.status === "near",
  );
  const overBudgets = budgetProgress.filter((item) => item.status === "over");

  const previousMonthKey =
    activePeriod === "all" ? null : getPreviousMonthKey(activePeriod);
  const previousTransactions =
    previousMonthKey === null
      ? []
      : transactionsForMonth(transactions, previousMonthKey);
  const previousLabel = previousMonthKey
    ? formatMonthLabel(previousMonthKey)
    : "";
  const previousIncome = sumIncome(previousTransactions);
  const previousExpenses = sumExpenses(previousTransactions);

  const demoCount = transactions.filter(
    (transaction) => transaction.isDemo,
  ).length;

  const insights: Insight[] = [];

  if (periodTransactions.length === 0) {
    insights.push({
      tone: "info",
      message:
        activePeriod === "all"
          ? "Add an income or expense transaction to generate rule-based insights."
          : `No transactions were recorded in ${periodLabel}. Choose another period or add an entry to see insights.`,
    });
  } else {
    if (highest && periodExpenses > 0) {
      const share = Math.round((highest.value / periodExpenses) * 100);
      insights.push({
        tone: share >= 50 ? "warning" : "info",
        message: `${highest.category} is the highest-spending category in ${periodLabel} at ${formatINR(
          highest.value,
        )}, or ${share}% of recorded expenses. Reviewing the largest ${highest.category} entries is the quickest way to change this total.`,
      });
    }

    if (overBudgets.length > 0) {
      const first = overBudgets[0];
      insights.push({
        tone: "warning",
        message: `${first.category} is ${formatINR(
          first.overBy,
        )} over its ${formatINR(
          first.limit,
        )} budget, based on all saved expenses. Consider pausing new ${
          first.category
        } spending or raising the limit deliberately.`,
      });
    } else {
      const near = budgetWatch.find((item) => item.status === "near");
      if (near) {
        insights.push({
          tone: "info",
          message: `${near.category} has used ${Math.round(
            near.percentUsed,
          )}% of its ${formatINR(near.limit)} budget. With ${formatINR(
            near.remaining,
          )} left, keep the next ${near.category} expense within that amount.`,
        });
      }
    }

    if (periodIncome > 0) {
      const difference = roundAmount(periodIncome - periodExpenses);
      insights.push({
        tone: difference >= 0 ? "success" : "warning",
        message:
          difference >= 0
            ? `Income of ${formatINR(periodIncome)} is ${formatINR(
                difference,
              )} above expenses in ${periodLabel}. Decide where that ${formatINR(
                difference,
              )} should go before it is spent.`
            : `Expenses are ${formatINR(
                Math.abs(difference),
              )} above income in ${periodLabel}. Review the categories above before the next income arrives.`,
      });
    } else if (periodExpenses > 0) {
      insights.push({
        tone: "info",
        message: `No income was recorded in ${periodLabel}, so this view compares expenses only.`,
      });
    }

    if (insights.length < 4 && budgets.length === 0) {
      insights.push({
        tone: "info",
        message:
          "No category budgets are set, so there are no budget-limit warnings to show.",
      });
    }

    if (insights.length < 4 && activePeriod === "all" && months.length > 1) {
      insights.push({
        tone: "info",
        message:
          "Choose a single month above to compare it with the month before.",
      });
    }
  }

  if (!hydrated) {
    return (
      <div className="stage3-stack" aria-busy="true">
        <p className="sr-only" role="status">
          Loading saved insights…
        </p>
        <div className="skeleton skeleton-notice" />
        <div className="stage3-metrics">
          {[0, 1, 2, 3].map((item) => (
            <div className="panel skeleton skeleton-card" key={item} />
          ))}
        </div>
        <div className="panel skeleton skeleton-panel" />
        <div className="panel skeleton skeleton-panel" />
      </div>
    );
  }

  const demoLabel =
    transactions.length === 0
      ? "No entries · demo data available"
      : demoCount === transactions.length
        ? "Demo mode · fictional sample data"
        : demoCount > 0
          ? "Demo data + your entries"
          : "Your saved transactions";

  return (
    <div className="stage3-stack">
      <div className="stage2-topbar">
        <span className="demo-pill">
          <span className="demo-pill-dot" />
          {demoLabel}
        </span>

        <div className="period-control">
          <label htmlFor={`${periodId}-period`}>Period</label>
          <select
            id={`${periodId}-period`}
            className="form-select"
            value={activePeriod}
            onChange={(event) => setRequestedPeriod(event.target.value)}
            disabled={months.length === 0}
          >
            <option value="all">All saved transactions</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataNotice />

      <section className="stage3-metrics" aria-label="Period totals">
        <MetricCard
          label="Total income"
          value={formatINR(periodIncome)}
          hint={`${periodLabel}`}
          icon={TrendingUp}
          positive={periodIncome > 0}
        />
        <MetricCard
          label="Total expenses"
          value={formatINR(periodExpenses)}
          hint={`${periodTransactions.length} ${
            periodTransactions.length === 1 ? "entry" : "entries"
          } in this period`}
          icon={TrendingDown}
        />
        <MetricCard
          label="Net change"
          value={formatINR(periodNet)}
          hint="Income minus expenses"
          icon={ArrowDownUp}
          negative={periodNet < 0}
          positive={periodNet > 0}
        />
        <MetricCard
          label="Highest category"
          value={highest ? highest.category : "—"}
          hint={
            highest
              ? `${formatINR(highest.value)} across ${
                  categoryRows.length
                } ${categoryRows.length === 1 ? "category" : "categories"}`
              : "No expenses in this period"
          }
          icon={Trophy}
        />
      </section>

      <div className="insights-row">
        <section
          className="panel stage3-panel"
          aria-labelledby={`${periodId}-categories`}
        >
          <div className="panel-heading">
            <div>
              <h3 id={`${periodId}-categories`}>Spending by category</h3>
              <p>
                Expense transactions only,{" "}
                {activePeriod === "all"
                  ? "across all saved transactions"
                  : `for ${periodLabel}`}
                .
              </p>
            </div>
            <PieChart size={18} aria-hidden="true" className="panel-heading-icon" />
          </div>

          {categoryRows.length === 0 ? (
            <div className="chart-empty">
              <PieChart size={22} aria-hidden="true" />
              <p>No expenses in this period, so there is no category split.</p>
            </div>
          ) : (
            <ul className="category-bars">
              {categoryRows.map((row) => {
                const meta = CATEGORY_META[row.category];
                const Icon = meta.icon;

                return (
                  <li className="category-bar-row" key={row.category}>
                    <div className="category-bar-head">
                      <span className="category-name">
                        <Icon
                          size={13}
                          aria-hidden="true"
                          style={{ color: meta.color }}
                        />
                        {row.category}
                      </span>
                      <span className="category-bar-value">
                        {formatINR(row.value)}{" "}
                        <span>({Math.round(row.percent)}%)</span>
                      </span>
                    </div>
                    <div
                      className="budget-track"
                      role="progressbar"
                      aria-label={`${row.category}: ${formatINR(
                        row.value,
                      )} of ${formatINR(periodExpenses)} in expenses`}
                      aria-valuemin={0}
                      aria-valuemax={periodExpenses}
                      aria-valuenow={row.value}
                    >
                      <div
                        className="budget-fill"
                        style={{
                          width: `${Math.min(row.percent, 100)}%`,
                          background: meta.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          className="panel stage3-panel"
          aria-labelledby={`${periodId}-budgets`}
        >
          <div className="panel-heading">
            <div>
              <h3 id={`${periodId}-budgets`}>Budget watch</h3>
              <p>
                Uses all saved expenses, matching the{" "}
                <Link href="/budgets" className="text-link">
                  Budgets page
                </Link>
                .
              </p>
            </div>
            <Gauge size={18} aria-hidden="true" className="panel-heading-icon" />
          </div>

          {budgets.length === 0 ? (
            <div className="chart-empty">
              <Gauge size={22} aria-hidden="true" />
              <p>No category budgets set yet.</p>
              <Link
                href="/budgets"
                className="button button-secondary button-small"
              >
                Set budgets
              </Link>
            </div>
          ) : budgetWatch.length === 0 ? (
            <div className="insight-success-box">
              <CheckCircle2 size={18} aria-hidden="true" />
              <p>
                No category is near or over its limit across all saved
                expenses. {budgets.length}{" "}
                {budgets.length === 1 ? "budget is" : "budgets are"} currently
                on track.
              </p>
            </div>
          ) : (
            <ul className="budget-watch-list">
              {budgetWatch.map((item: BudgetProgress) => (
                <li
                  className={`budget-watch-item budget-watch-${item.status}`}
                  key={item.category}
                >
                  <span className="budget-watch-icon" aria-hidden="true">
                    {item.status === "over" ? (
                      <AlertTriangle size={15} />
                    ) : (
                      <Gauge size={15} />
                    )}
                  </span>
                  <div>
                    <p className="budget-watch-title">
                      {item.category}
                      <span
                        className={`budget-status budget-status-${item.status}`}
                      >
                        {item.status === "over" ? "Over budget" : "Near limit"}
                      </span>
                    </p>
                    <p className="budget-watch-copy">
                      {item.status === "over"
                        ? `${formatINR(item.spent)} spent of ${formatINR(
                            item.limit,
                          )}. Over by ${formatINR(item.overBy)}.`
                        : `${formatINR(item.spent)} spent of ${formatINR(
                            item.limit,
                          )}. ${formatINR(item.remaining)} remaining.`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="insights-row">
        <section
          className="panel stage3-panel"
          aria-labelledby={`${periodId}-comparison`}
        >
          <div className="panel-heading">
            <div>
              <h3 id={`${periodId}-comparison`}>Period comparison</h3>
              <p>
                Only recorded transactions are compared. No past months are
                invented.
              </p>
            </div>
            <CalendarRange
              size={18}
              aria-hidden="true"
              className="panel-heading-icon"
            />
          </div>

          {activePeriod === "all" ? (
            <div className="insight-info-box">
              <Info size={17} aria-hidden="true" />
              <p>
                Choose one month above to compare it with the month before.
                All saved transactions are not compared with an invented
                earlier period.
              </p>
            </div>
          ) : previousTransactions.length === 0 ? (
            <div className="insight-info-box">
              <Info size={17} aria-hidden="true" />
              <p>
                No transactions were recorded in {previousLabel}, so there is
                not enough data for a complete comparison with {periodLabel}.
              </p>
            </div>
          ) : (
            <div className="comparison-list">
              <div className="comparison-row">
                <span>Expenses</span>
                {previousExpenses > 0 ? (
                  <p>
                    {formatINR(periodExpenses)} in {periodLabel}.{" "}
                    {describeChange(
                      periodExpenses,
                      previousExpenses,
                      "Expenses",
                      previousLabel,
                    )}
                  </p>
                ) : (
                  <p>
                    {formatINR(periodExpenses)} in {periodLabel}. There were no
                    recorded expenses in {previousLabel}, so an expense
                    percentage comparison is not shown.
                  </p>
                )}
              </div>
              <div className="comparison-row">
                <span>Income</span>
                {previousIncome > 0 ? (
                  <p>
                    {formatINR(periodIncome)} in {periodLabel}.{" "}
                    {describeChange(
                      periodIncome,
                      previousIncome,
                      "Income",
                      previousLabel,
                    )}
                  </p>
                ) : (
                  <p>
                    {formatINR(periodIncome)} in {periodLabel}. There was no
                    recorded income in {previousLabel}, so an income percentage
                    comparison is not shown.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section
          className="panel stage3-panel"
          aria-labelledby={`${periodId}-suggestions`}
        >
          <div className="panel-heading">
            <div>
              <h3 id={`${periodId}-suggestions`}>Rule-based suggestions</h3>
              <p>Each suggestion names the figures it uses.</p>
            </div>
            <Wallet
              size={18}
              aria-hidden="true"
              className="panel-heading-icon"
            />
          </div>

          <ul className="insight-list">
            {insights.slice(0, 4).map((insight, index) => {
              const Icon = INSIGHT_ICONS[insight.tone];

              return (
                <li
                  className={`insight-item insight-${insight.tone}`}
                  key={`${insight.tone}-${index}`}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>{insight.message}</span>
                </li>
              );
            })}
          </ul>

          <p className="insight-footnote">
            These tips use simple rules on your saved figures. No AI service is
            connected, no missing history is estimated, and this is not
            professional financial advice.
          </p>
        </section>
      </div>

      <AffordabilityCalculator />
    </div>
  );
}
