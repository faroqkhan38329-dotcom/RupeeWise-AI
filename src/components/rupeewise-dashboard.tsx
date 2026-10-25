"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_META } from "@/components/category-meta";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataNotice } from "@/components/data-notice";
import { MetricCard } from "@/components/metric-card";
import { TransactionFormModal } from "@/components/transaction-form";
import {
  CATEGORIES,
  STARTING_ALLOWANCE,
  formatINR,
  formatTransactionDate,
  getBudgetProgress,
  getFinanceSummary,
  getTotalBudget,
  sumByCategory,
} from "@/lib/finance";
import type {
  BudgetProgress,
  FinanceSummary,
  Transaction,
} from "@/lib/finance";
import { deleteTransaction, useFinanceStore } from "@/lib/finance-store";

type Insight = {
  tone: "warning" | "success" | "info";
  message: string;
};

const INSIGHT_ICONS: Record<Insight["tone"], LucideIcon> = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

function buildInsights(
  transactionCount: number,
  summary: FinanceSummary,
  progress: BudgetProgress[],
): Insight[] {
  if (transactionCount === 0) {
    return [
      {
        tone: "info",
        message:
          "Add an expense or income entry to see calculated totals and rule-based tips.",
      },
    ];
  }

  const insights: Insight[] = [];

  if (summary.remaining < 0) {
    insights.push({
      tone: "warning",
      message: `Expenses are ${formatINR(Math.abs(summary.remaining))} above the allowance and income available.`,
    });
  }

  for (const item of progress) {
    if (item.status !== "over") continue;
    if (insights.length >= 3) break;

    insights.push({
      tone: "warning",
      message: `${item.category} is ${formatINR(item.overBy)} over its ${formatINR(item.limit)} budget.`,
    });
  }

  const nearLimit = progress.find((item) => item.status === "near");

  if (nearLimit && insights.length < 3) {
    insights.push({
      tone: "info",
      message: `${nearLimit.category} has used ${Math.round(nearLimit.percentUsed)}% of its budget.`,
    });
  }

  if (insights.length === 0) {
    if (summary.income > 0) {
      insights.push({
        tone: "success",
        message: `Income of ${formatINR(summary.income)} is included in this month's remaining balance.`,
      });
    } else if (summary.balanceRate !== null && summary.balanceRate >= 30) {
      insights.push({
        tone: "success",
        message: `You are keeping ${Math.round(summary.balanceRate)}% of the available funds. That is a healthy buffer.`,
      });
    } else {
      insights.push({
        tone: "info",
        message:
          "Review flexible categories to free up a little room in the budget.",
      });
    }
  }

  return insights.slice(0, 3);
}

export function RupeeWiseDashboard() {
  const { data, hydrated } = useFinanceStore();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [feedback, setFeedback] = useState("");

  const { transactions, budgets } = data;
  const summary = useMemo(() => getFinanceSummary(transactions), [transactions]);
  const categorySpending = useMemo(
    () => sumByCategory(transactions),
    [transactions],
  );
  const progress = useMemo(
    () => getBudgetProgress(budgets, transactions),
    [budgets, transactions],
  );
  const totalBudget = getTotalBudget(budgets);
  const insights = useMemo(
    () => buildInsights(transactions.length, summary, progress),
    [transactions.length, summary, progress],
  );

  const chartData = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        name: category,
        value: categorySpending[category],
      })).filter((entry) => entry.value > 0),
    [categorySpending],
  );

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
        )
        .slice(0, 6),
    [transactions],
  );

  const incomeCount = transactions.filter(
    (transaction) => transaction.type === "income",
  ).length;
  const expenseCount = transactions.length - incomeCount;
  const demoCount = transactions.filter((transaction) => transaction.isDemo).length;

  if (!hydrated) {
    return (
      <div className="stage3-stack" aria-busy="true">
        <p className="sr-only" role="status">
          Loading saved dashboard…
        </p>
        <div className="skeleton skeleton-notice" />
        <div className="stage2-metrics stage2-metrics-five">
          {[0, 1, 2, 3, 4].map((item) => (
            <div className="panel skeleton skeleton-card" key={item} />
          ))}
        </div>
        <div className="stage2-row">
          <div className="panel skeleton skeleton-panel" />
          <div className="panel skeleton skeleton-panel" />
        </div>
        <div className="stage2-row stage2-row-wide">
          <div className="panel skeleton skeleton-panel" />
          <div className="panel skeleton skeleton-panel" />
        </div>
      </div>
    );
  }

  const demoLabel =
    transactions.length === 0
      ? "No entries · demo data available"
      : demoCount === transactions.length
        ? "Demo mode · fictional sample data"
        : "Demo data + your entries";

  return (
    <div>
      <div className="stage2-topbar">
        <span className="demo-pill">
          <span className="demo-pill-dot" />
          {demoLabel}
        </span>
        <button
          type="button"
          className="button button-primary button-small"
          onClick={() => {
            setFeedback("");
            setFormOpen(true);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Add expense
        </button>
      </div>

      <DataNotice />

      {feedback && (
        <div className="inline-feedback" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{feedback}</span>
          <button
            type="button"
            className="notice-dismiss"
            onClick={() => setFeedback("")}
            aria-label="Dismiss confirmation"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      <section
        className="stage2-metrics stage2-metrics-five"
        aria-label="Financial summary"
      >
        <MetricCard
          label="Monthly allowance"
          value={formatINR(STARTING_ALLOWANCE)}
          hint="Starting amount, not a bank balance"
          icon={Wallet}
        />
        <MetricCard
          label="Total income"
          value={formatINR(summary.income)}
          hint={`${incomeCount} income ${incomeCount === 1 ? "entry" : "entries"}`}
          icon={TrendingUp}
          positive={summary.income > 0}
        />
        <MetricCard
          label="Total expenses"
          value={formatINR(summary.expenses)}
          hint={`${expenseCount} expense ${expenseCount === 1 ? "entry" : "entries"}`}
          icon={ArrowUpRight}
        />
        <MetricCard
          label="Remaining balance"
          value={formatINR(summary.remaining)}
          hint="Allowance + income − expenses"
          icon={ArrowDownRight}
          negative={summary.remaining < 0}
        />
        <MetricCard
          label="Balance rate"
          value={
            summary.balanceRate === null
              ? "—"
              : `${Math.round(summary.balanceRate)}%`
          }
          hint="Remaining ÷ total funds"
          icon={Sparkles}
          negative={
            summary.balanceRate !== null && summary.balanceRate < 0
          }
        />
      </section>

      <div className="stage2-row">
        <section
          className="panel stage2-panel"
          aria-labelledby="spending-title"
        >
          <div className="panel-heading">
            <div>
              <h3 id="spending-title">Spending by category</h3>
              <p>Distribution of expense transactions only.</p>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="chart-empty">
              <ReceiptText size={22} aria-hidden="true" />
              <p>No expenses yet. Add one to see the chart.</p>
            </div>
          ) : (
            <>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            CATEGORY_META[
                              entry.name as keyof typeof CATEGORY_META
                            ].color
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatINR(Number(value))}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        color: "var(--text)",
                        fontSize: 12,
                      }}
                      itemStyle={{ color: "var(--text)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center" aria-hidden="true">
                  <span>Total spent</span>
                  <strong>{formatINR(summary.expenses)}</strong>
                </div>
              </div>

              <ul className="legend">
                {chartData.map((entry) => (
                  <li className="legend-item" key={entry.name}>
                    <span
                      className="legend-dot"
                      style={{
                        background:
                          CATEGORY_META[
                            entry.name as keyof typeof CATEGORY_META
                          ].color,
                      }}
                    />
                    <span className="legend-label">{entry.name}</span>
                    <span className="legend-value">
                      {formatINR(entry.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="panel stage2-panel" aria-labelledby="budgets-title">
          <div className="panel-heading">
            <div>
              <h3 id="budgets-title">Category budgets</h3>
              <p>
                Limits saved in this browser.{" "}
                <Link href="/budgets" className="text-link">
                  Manage
                </Link>
              </p>
            </div>
            <span className="panel-total">
              {budgets.length > 0
                ? `${formatINR(summary.expenses)} / ${formatINR(totalBudget)}`
                : `${formatINR(summary.expenses)} spent`}
            </span>
          </div>

          {progress.length === 0 ? (
            <div className="chart-empty">
              <ReceiptText size={22} aria-hidden="true" />
              <p>No budgets yet. Set category limits to track progress.</p>
              <Link
                href="/budgets"
                className="button button-secondary button-small"
              >
                Set budgets
              </Link>
            </div>
          ) : (
            <div className="category-list">
              {progress.map((item) => {
                const meta = CATEGORY_META[item.category];
                const Icon = meta.icon;
                const over = item.status === "over";
                const near = item.status === "near";
                const width = Math.min(item.percentUsed, 100);

                return (
                  <div key={item.category}>
                    <div className="category-head">
                      <span className="category-name">
                        <Icon
                          size={13}
                          aria-hidden="true"
                          style={{ color: meta.color }}
                        />
                        {item.category}
                        {item.budget.isDemo && (
                          <span className="data-badge">Sample</span>
                        )}
                      </span>
                      <span className="category-amounts">
                        <strong>{formatINR(item.spent)}</strong> /{" "}
                        {formatINR(item.limit)}
                      </span>
                    </div>
                    <div
                      className="budget-track"
                      role="progressbar"
                      aria-label={`${item.category} budget: ${formatINR(
                        item.spent,
                      )} spent of ${formatINR(item.limit)}`}
                      aria-valuemin={0}
                      aria-valuemax={item.limit}
                      aria-valuenow={Math.min(item.spent, item.limit)}
                    >
                      <div
                        className={`budget-fill${
                          over
                            ? " budget-fill-over"
                            : near
                              ? " budget-fill-near"
                              : ""
                        }`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    {over && (
                      <p className="category-alert">
                        Over by {formatINR(item.overBy)}
                      </p>
                    )}
                    {near && (
                      <p className="budget-warning">
                        Only {formatINR(item.remaining)} left
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="stage2-row stage2-row-wide">
        <section
          className="panel stage2-panel"
          aria-labelledby="transactions-title"
        >
          <div className="panel-heading">
            <div>
              <h3 id="transactions-title">Recent transactions</h3>
              <p>Delete any entry to recalculate every figure.</p>
            </div>
            <Link href="/transactions" className="text-link">
              View all {transactions.length > 0 ? `(${transactions.length})` : ""}
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="txn-empty">
              <ReceiptText size={22} aria-hidden="true" />
              <p>No transactions. Add an expense to see totals update.</p>
              <button
                type="button"
                className="button button-primary button-small"
                onClick={() => setFormOpen(true)}
              >
                <Plus size={15} aria-hidden="true" />
                Add expense
              </button>
            </div>
          ) : (
            <ul className="txn-list">
              {recentTransactions.map((transaction) => {
                const meta = CATEGORY_META[transaction.category];
                const Icon = meta.icon;

                return (
                  <li className="txn-row" key={transaction.id}>
                    <span className="txn-icon">
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <div className="txn-main">
                      <p className="txn-title">
                        {transaction.description}
                        {transaction.isDemo && (
                          <span className="data-badge txn-badge">Sample</span>
                        )}
                      </p>
                      <p className="txn-meta">
                        {transaction.category} ·{" "}
                        {formatTransactionDate(transaction.date)}
                      </p>
                    </div>
                    <span
                      className={`txn-amount txn-amount-${transaction.type}`}
                    >
                      {transaction.type === "income" ? "+" : "−"}
                      {formatINR(transaction.amount)}
                    </span>
                    <button
                      type="button"
                      className="txn-delete"
                      onClick={() => setDeleteTarget(transaction)}
                      aria-label={`Delete ${transaction.description}`}
                      title="Delete transaction"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {transactions.length > 6 && (
            <p className="panel-footnote">
              Showing the 6 most recent entries.{" "}
              <Link href="/transactions" className="text-link">
                See all {transactions.length}
              </Link>
            </p>
          )}
        </section>

        <section className="panel stage2-panel" aria-labelledby="tips-title">
          <div className="panel-heading">
            <div>
              <h3 id="tips-title">Money tips</h3>
              <p>Rule-based insights, not AI-generated advice.</p>
            </div>
          </div>

          <ul className="insight-list">
            {insights.map((insight, index) => {
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
            These tips come from your saved figures using simple rules. No AI
            service is connected, and this is not professional financial advice.
          </p>
        </section>
      </div>

      {formOpen && (
        <TransactionFormModal
          mode="create"
          allowIncome={false}
          onClose={() => setFormOpen(false)}
          onSuccess={(message) => setFeedback(message)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this transaction?"
          description={`Delete “${deleteTarget.description}” for ${formatINR(
            deleteTarget.amount,
          )}? Dashboard totals, charts and budget progress will update immediately.`}
          confirmLabel="Delete transaction"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteTransaction(deleteTarget.id);
            setDeleteTarget(null);
            setFeedback("Transaction deleted.");
          }}
        />
      )}
    </div>
  );
}
