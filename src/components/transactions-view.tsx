"use client";

import { useId, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataNotice } from "@/components/data-notice";
import { MetricCard } from "@/components/metric-card";
import { TransactionFormModal } from "@/components/transaction-form";
import { CATEGORY_META } from "@/components/category-meta";
import {
  CATEGORIES,
  formatINR,
  formatTransactionDate,
  getFinanceSummary,
  roundAmount,
} from "@/lib/finance";
import type { Category, Transaction, TransactionType } from "@/lib/finance";
import { deleteTransaction, useFinanceStore } from "@/lib/finance-store";

type TypeFilter = "all" | TransactionType;
type CategoryFilter = "all" | Category;
type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function TransactionsView() {
  const { data, hydrated } = useFinanceStore();
  const filtersId = useId();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<SortOption>("date-desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [feedback, setFeedback] = useState("");

  const transactions = data.transactions;
  const summary = useMemo(() => getFinanceSummary(transactions), [transactions]);
  const net = roundAmount(summary.income - summary.expenses);
  const expenseCount = transactions.filter(
    (transaction) => transaction.type === "expense",
  ).length;
  const incomeCount = transactions.length - expenseCount;
  const demoCount = transactions.filter((transaction) => transaction.isDemo).length;

  const dateRangeInvalid = Boolean(fromDate && toDate && fromDate > toDate);
  const hasFilters = Boolean(
    search.trim() ||
      typeFilter !== "all" ||
      categoryFilter !== "all" ||
      fromDate ||
      toDate,
  );

  const visibleTransactions = useMemo(() => {
    if (dateRangeInvalid) return [];

    const term = search.trim().toLowerCase();

    const filtered = transactions.filter((transaction) => {
      if (term && !transaction.description.toLowerCase().includes(term)) {
        return false;
      }
      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }
      if (
        categoryFilter !== "all" &&
        transaction.category !== categoryFilter
      ) {
        return false;
      }
      if (fromDate && transaction.date < fromDate) return false;
      if (toDate && transaction.date > toDate) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const byDate = (first: Transaction, second: Transaction) =>
        first.date === second.date
          ? first.id.localeCompare(second.id)
          : first.date.localeCompare(second.date);

      switch (sort) {
        case "date-asc":
          return byDate(a, b);
        case "amount-desc":
          return b.amount - a.amount || byDate(b, a);
        case "amount-asc":
          return a.amount - b.amount || byDate(b, a);
        default:
          return byDate(b, a);
      }
    });
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    fromDate,
    toDate,
    sort,
    dateRangeInvalid,
  ]);

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setFromDate("");
    setToDate("");
  }

  function openCreate() {
    setFeedback("");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setFeedback("");
    setEditing(transaction);
    setFormOpen(true);
  }

  if (!hydrated) {
    return (
      <div className="stage3-stack" aria-busy="true">
        <p className="sr-only" role="status">
          Loading saved transactions…
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
        : "Demo data + your entries";

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
        >
          <Plus size={16} aria-hidden="true" />
          Add transaction
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

      <section className="stage3-metrics" aria-label="Transaction totals">
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
          icon={TrendingDown}
        />
        <MetricCard
          label="Net change"
          value={formatINR(net)}
          hint="Income minus expenses"
          icon={ArrowDownUp}
          negative={net < 0}
          positive={net > 0}
        />
        <MetricCard
          label="Balance after income"
          value={formatINR(summary.remaining)}
          hint="Allowance + income − expenses"
          icon={Wallet}
          negative={summary.remaining < 0}
        />
      </section>

      <section
        className="panel stage3-panel"
        aria-labelledby={`${filtersId}-filters-title`}
      >
        <div className="panel-heading">
          <div>
            <h3 id={`${filtersId}-filters-title`}>Search and filter</h3>
            <p>Totals above always include every saved transaction.</p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            Clear filters
          </button>
        </div>

        <div className="filter-grid">
          <div className="form-field filter-field filter-search">
            <label htmlFor={`${filtersId}-search`}>Search description</label>
            <div className="input-with-icon">
              <Search size={15} aria-hidden="true" />
              <input
                id={`${filtersId}-search`}
                className="form-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="e.g. canteen"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-field filter-field">
            <label htmlFor={`${filtersId}-type`}>Type</label>
            <select
              id={`${filtersId}-type`}
              className="form-select"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as TypeFilter)
              }
            >
              <option value="all">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-field filter-field">
            <label htmlFor={`${filtersId}-category`}>Category</label>
            <select
              id={`${filtersId}-category`}
              className="form-select"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as CategoryFilter)
              }
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field filter-field">
            <label htmlFor={`${filtersId}-from`}>From date</label>
            <input
              id={`${filtersId}-from`}
              className="form-input"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>

          <div className="form-field filter-field">
            <label htmlFor={`${filtersId}-to`}>To date</label>
            <input
              id={`${filtersId}-to`}
              className="form-input"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>

          <div className="form-field filter-field">
            <label htmlFor={`${filtersId}-sort`}>Sort by</label>
            <select
              id={`${filtersId}-sort`}
              className="form-select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
            >
              <option value="date-desc">Date (newest first)</option>
              <option value="date-asc">Date (oldest first)</option>
              <option value="amount-desc">Amount (highest first)</option>
              <option value="amount-asc">Amount (lowest first)</option>
            </select>
          </div>
        </div>

        {dateRangeInvalid && (
          <p className="filter-error" role="alert">
            The &ldquo;from&rdquo; date must be on or before the
            &ldquo;to&rdquo; date.
          </p>
        )}
      </section>

      <section
        className="panel stage3-panel"
        aria-labelledby={`${filtersId}-list-title`}
      >
        <div className="panel-heading">
          <div>
            <h3 id={`${filtersId}-list-title`}>Transactions</h3>
            <p>
              Showing {visibleTransactions.length} of {transactions.length}
              {hasFilters ? " (filters active)" : ""}.
            </p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="txn-empty tx-empty-large">
            <ReceiptText size={22} aria-hidden="true" />
            <p>
              No transactions yet. Add your first income or expense to see
              totals, filters and budget progress update.
            </p>
            <button
              type="button"
              className="button button-primary button-small"
              onClick={openCreate}
            >
              <Plus size={15} aria-hidden="true" />
              Add transaction
            </button>
          </div>
        ) : visibleTransactions.length === 0 ? (
          <div className="txn-empty tx-empty-large">
            <Search size={22} aria-hidden="true" />
            <p>
              {dateRangeInvalid
                ? "Fix the date range to see matching transactions."
                : "No transactions match these search and filter settings."}
            </p>
            {hasFilters && (
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="tx-list">
            {visibleTransactions.map((transaction) => {
              const meta = CATEGORY_META[transaction.category];
              const Icon = meta.icon;
              const signedAmount =
                transaction.type === "income"
                  ? `+${formatINR(transaction.amount)}`
                  : `−${formatINR(transaction.amount)}`;

              return (
                <li className="tx-item" key={transaction.id}>
                  <span
                    className="tx-icon"
                    style={{ color: meta.color }}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>

                  <div className="tx-main">
                    <div className="tx-title-row">
                      <p className="tx-title">{transaction.description}</p>
                      {transaction.isDemo && (
                        <span className="data-badge">Sample</span>
                      )}
                      <span
                        className={`tx-type-tag tx-type-tag-${transaction.type}`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowDownLeft size={11} aria-hidden="true" />
                        ) : (
                          <ArrowUpRight size={11} aria-hidden="true" />
                        )}
                        {transaction.type === "income" ? "Income" : "Expense"}
                      </span>
                    </div>
                    <p className="tx-meta">
                      {transaction.category} ·{" "}
                      {formatTransactionDate(transaction.date)}
                    </p>
                    {transaction.notes && (
                      <p className="tx-notes">{transaction.notes}</p>
                    )}
                  </div>

                  <span
                    className={`tx-amount tx-amount-${transaction.type}`}
                  >
                    {signedAmount}
                  </span>

                  <div className="tx-actions">
                    <button
                      type="button"
                      className="icon-action"
                      onClick={() => openEdit(transaction)}
                      aria-label={`Edit ${transaction.description}`}
                      title="Edit transaction"
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-action icon-action-danger"
                      onClick={() => setDeleteTarget(transaction)}
                      aria-label={`Delete ${transaction.description}`}
                      title="Delete transaction"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {formOpen && (
        <TransactionFormModal
          mode={editing ? "edit" : "create"}
          initial={editing ?? undefined}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSuccess={(message) => setFeedback(message)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this transaction?"
          description={`Delete “${deleteTarget.description}” for ${formatINR(
            deleteTarget.amount,
          )}? Totals, category spending and budget progress will update immediately.`}
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
