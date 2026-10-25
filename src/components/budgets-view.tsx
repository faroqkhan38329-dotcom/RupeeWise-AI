"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { BudgetFormModal } from "@/components/budget-form";
import { CATEGORY_META } from "@/components/category-meta";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataNotice } from "@/components/data-notice";
import { MetricCard } from "@/components/metric-card";
import {
  CATEGORIES,
  formatINR,
  getBudgetProgress,
  getFinanceSummary,
  getTotalBudget,
  roundAmount,
} from "@/lib/finance";
import type { Budget, Category } from "@/lib/finance";
import { deleteBudget, useFinanceStore } from "@/lib/finance-store";

export function BudgetsView() {
  const { data, hydrated } = useFinanceStore();
  const headingId = useId();
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [feedback, setFeedback] = useState("");

  const { transactions, budgets } = data;
  const progress = useMemo(
    () => getBudgetProgress(budgets, transactions),
    [budgets, transactions],
  );
  const summary = useMemo(() => getFinanceSummary(transactions), [transactions]);
  const totalBudget = getTotalBudget(budgets);
  const budgetRemaining = roundAmount(totalBudget - summary.expenses);
  const overCount = progress.filter((item) => item.status === "over").length;
  const nearCount = progress.filter((item) => item.status === "near").length;
  const expenseCount = transactions.filter(
    (transaction) => transaction.type === "expense",
  ).length;
  const budgetedCategories = budgets.map((budget) => budget.category);
  const availableCategories = CATEGORIES.filter(
    (category) => !budgetedCategories.includes(category),
  );
  const demoCount = budgets.filter((budget) => budget.isDemo).length;

  const overItems = progress.filter((item) => item.status === "over");
  const nearItems = progress.filter((item) => item.status === "near");

  function openCreate() {
    setFeedback("");
    setEditingBudget(null);
    setFormMode("create");
  }

  function openEdit(budget: Budget) {
    setFeedback("");
    setEditingBudget(budget);
    setFormMode("edit");
  }

  if (!hydrated) {
    return (
      <div className="stage3-stack" aria-busy="true">
        <p className="sr-only" role="status">
          Loading saved budgets…
        </p>
        <div className="skeleton skeleton-notice" />
        <div className="stage3-metrics">
          {[0, 1, 2, 3].map((item) => (
            <div className="panel skeleton skeleton-card" key={item} />
          ))}
        </div>
        <div className="panel skeleton skeleton-panel" />
      </div>
    );
  }

  const demoLabel =
    budgets.length === 0
      ? "No budgets · demo data available"
      : demoCount === budgets.length
        ? "Demo mode · fictional sample budgets"
        : "Demo data + your budgets";

  return (
    <div className="stage3-stack">
      <div className="stage2-topbar">
        <span className="demo-pill">
          <span className="demo-pill-dot" />
          {demoLabel}
        </span>
        <button
          type="button"
          className="button button-primary button-small"
          onClick={openCreate}
          disabled={availableCategories.length === 0}
          title={
            availableCategories.length === 0
              ? "Every category already has a budget"
              : undefined
          }
        >
          <Plus size={16} aria-hidden="true" />
          Create budget
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

      {overItems.length > 0 && (
        <div className="inline-feedback inline-feedback-warning" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>
            <strong>Over budget:</strong>{" "}
            {overItems.map((item) => item.category).join(", ")}. Review these
            categories or adjust their limits.
          </span>
        </div>
      )}

      {nearItems.length > 0 && (
        <div className="inline-feedback inline-feedback-info" role="status">
          <Gauge size={16} aria-hidden="true" />
          <span>
            <strong>Approaching a limit:</strong>{" "}
            {nearItems
              .map(
                (item) =>
                  `${item.category} (${Math.round(item.percentUsed)}%)`,
              )
              .join(", ")}
            .
          </span>
        </div>
      )}

      <section className="stage3-metrics" aria-label="Budget totals">
        <MetricCard
          label="Monthly budget"
          value={formatINR(totalBudget)}
          hint={`${budgets.length} ${budgets.length === 1 ? "category" : "categories"} with a limit`}
          icon={Target}
        />
        <MetricCard
          label="Spent from budget"
          value={formatINR(summary.expenses)}
          hint={`${expenseCount} expense ${expenseCount === 1 ? "entry" : "entries"}`}
          icon={Wallet}
        />
        <MetricCard
          label="Budget remaining"
          value={formatINR(budgetRemaining)}
          hint={
            budgetRemaining < 0
              ? "Total spending is above all limits"
              : "Total budget minus expenses"
          }
          icon={PiggyBank}
          negative={budgetRemaining < 0}
        />
        <MetricCard
          label="Budgets exceeded"
          value={`${overCount} of ${budgets.length}`}
          hint={
            nearCount > 0
              ? `${nearCount} approaching a limit`
              : "No categories near their limit"
          }
          icon={AlertTriangle}
          negative={overCount > 0}
        />
      </section>

      <section
        className="panel stage3-panel"
        aria-labelledby={`${headingId}-title`}
      >
        <div className="panel-heading">
          <div>
            <h3 id={`${headingId}-title`}>Category budgets</h3>
            <p>
              Calculated from {expenseCount} expense{" "}
              {expenseCount === 1 ? "transaction" : "transactions"}. Updates
              automatically when transactions change.
            </p>
          </div>
          {budgets.length > 0 && availableCategories.length > 0 && (
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={openCreate}
            >
              <Plus size={15} aria-hidden="true" />
              Add
            </button>
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="txn-empty tx-empty-large">
            <Target size={22} aria-hidden="true" />
            <p>
              No category budgets yet. Create one to track spending, see what is
              left and get a warning before a category goes over its limit.
            </p>
            <button
              type="button"
              className="button button-primary button-small"
              onClick={openCreate}
            >
              <Plus size={15} aria-hidden="true" />
              Create budget
            </button>
          </div>
        ) : (
          <ul className="budget-grid">
            {progress.map((item) => {
              const meta = CATEGORY_META[item.category];
              const Icon = meta.icon;
              const percentLabel = item.percentUsed >= 999
                ? "999%+"
                : `${Math.round(item.percentUsed)}%`;
              const width = Math.min(item.percentUsed, 100);

              return (
                <li
                  className={`budget-card budget-card-${item.status}`}
                  key={item.category}
                >
                  <div className="budget-card-head">
                    <span className="category-name">
                      <Icon
                        size={14}
                        aria-hidden="true"
                        style={{ color: meta.color }}
                      />
                      {item.category}
                      {item.budget.isDemo && (
                        <span className="data-badge">Sample limit</span>
                      )}
                    </span>
                    <span
                      className={`budget-status budget-status-${item.status}`}
                    >
                      {item.status === "over"
                        ? "Over budget"
                        : item.status === "near"
                          ? "Near limit"
                          : "On track"}
                    </span>
                  </div>

                  <div className="budget-figures">
                    <div>
                      <span>Spent</span>
                      <strong>{formatINR(item.spent)}</strong>
                    </div>
                    <div>
                      <span>Limit</span>
                      <strong>{formatINR(item.limit)}</strong>
                    </div>
                    <div>
                      <span>
                        {item.status === "over" ? "Over by" : "Remaining"}
                      </span>
                      <strong
                        className={
                          item.status === "over"
                            ? "text-negative"
                            : undefined
                        }
                      >
                        {item.status === "over"
                          ? formatINR(item.overBy)
                          : formatINR(item.remaining)}
                      </strong>
                    </div>
                  </div>

                  <div className="budget-usage-head">
                    <span>Usage</span>
                    <span>{percentLabel} used</span>
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
                        item.status === "over"
                          ? " budget-fill-over"
                          : item.status === "near"
                            ? " budget-fill-near"
                            : ""
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>

                  {item.status === "over" && (
                    <p className="category-alert">
                      This category is over its limit by{" "}
                      {formatINR(item.overBy)}.
                    </p>
                  )}
                  {item.status === "near" && (
                    <p className="budget-warning">
                      {percentLabel} used. Only{" "}
                      {formatINR(item.remaining)} remains in this budget.
                    </p>
                  )}

                  <div className="budget-card-actions">
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() => openEdit(item.budget)}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      Edit limit
                    </button>
                    <button
                      type="button"
                      className="icon-action icon-action-danger"
                      onClick={() => setDeleteTarget(item.budget)}
                      aria-label={`Delete ${item.category} budget`}
                      title="Delete budget"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {budgets.length > 0 && availableCategories.length === 0 && (
          <p className="budget-footnote">
            Every category has a budget. Edit an existing limit to make changes.
          </p>
        )}
      </section>

      {formMode && (
        <BudgetFormModal
          mode={formMode}
          initial={formMode === "edit" ? editingBudget ?? undefined : undefined}
          availableCategories={
            formMode === "edit"
              ? editingBudget
                ? [editingBudget.category]
                : availableCategories
              : availableCategories
          }
          onClose={() => {
            setFormMode(null);
            setEditingBudget(null);
          }}
          onSuccess={(message) => setFeedback(message)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this budget?"
          description={`Delete the ${deleteTarget.category} limit of ${formatINR(
            deleteTarget.limit,
          )}? Your transactions stay, but this category will no longer be tracked against a budget.`}
          confirmLabel="Delete budget"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteBudget(deleteTarget.category as Category);
            setDeleteTarget(null);
            setFeedback("Budget deleted. Transactions were not changed.");
          }}
        />
      )}
    </div>
  );
}
