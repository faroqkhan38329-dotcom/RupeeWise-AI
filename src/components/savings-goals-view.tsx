"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Goal,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataNotice } from "@/components/data-notice";
import { GoalActivityModal } from "@/components/goal-activity-form";
import { GoalFormModal } from "@/components/goal-form";
import { MetricCard } from "@/components/metric-card";
import {
  formatINR,
  formatTransactionDate,
  getFinanceSummary,
  getGoalProgress,
  getGoalsSummary,
  getTodayISO,
  roundAmount,
} from "@/lib/finance";
import type {
  GoalActivityMode,
  SavingsGoal,
} from "@/lib/finance";
import { deleteGoal, useFinanceStore } from "@/lib/finance-store";

type GoalActivityState = {
  goal: SavingsGoal;
  mode: GoalActivityMode;
};

export function SavingsGoalsView() {
  const { data, hydrated } = useFinanceStore();
  const headingId = useId();
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [activity, setActivity] = useState<GoalActivityState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [feedback, setFeedback] = useState("");

  const { transactions, goals } = data;
  const summary = useMemo(() => getFinanceSummary(transactions), [transactions]);
  const goalsSummary = useMemo(() => getGoalsSummary(goals), [goals]);
  const progress = useMemo(
    () => goals.map((goal) => getGoalProgress(goal)),
    [goals],
  );
  const availableToAllocate = roundAmount(
    summary.remaining - goalsSummary.totalSaved,
  );
  const demoCount = goals.filter((goal) => goal.isDemo).length;

  function openCreate() {
    setFeedback("");
    setEditingGoal(null);
    setFormMode("create");
  }

  function openEdit(goal: SavingsGoal) {
    setFeedback("");
    setEditingGoal(goal);
    setFormMode("edit");
  }

  if (!hydrated) {
    return (
      <div className="stage3-stack" aria-busy="true">
        <p className="sr-only" role="status">
          Loading saved savings goals…
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

  const today = getTodayISO();
  const demoLabel =
    goals.length === 0
      ? "No goals · demo data available"
      : demoCount === goals.length
        ? "Demo mode · fictional sample goals"
        : demoCount > 0
          ? "Demo data + your goals"
          : "Your savings goals";

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
          Create goal
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

      <section className="stage3-metrics" aria-label="Savings goal totals">
        <MetricCard
          label="Total targets"
          value={formatINR(goalsSummary.totalTarget)}
          hint={`${goals.length} ${goals.length === 1 ? "goal" : "goals"} tracked`}
          icon={Target}
        />
        <MetricCard
          label="Saved toward goals"
          value={formatINR(goalsSummary.totalSaved)}
          hint="Progress you have recorded"
          icon={PiggyBank}
          positive={goalsSummary.totalSaved > 0}
        />
        <MetricCard
          label="Still needed"
          value={formatINR(goalsSummary.totalRemaining)}
          hint="Across all unfinished goals"
          icon={Wallet}
        />
        <MetricCard
          label="Goals completed"
          value={`${goalsSummary.completedCount} of ${goals.length}`}
          hint={
            goals.length === 0
              ? "Create a goal to get started"
              : goalsSummary.activeCount === 1
                ? "1 goal still in progress"
                : `${goalsSummary.activeCount} goals still in progress`
          }
          icon={CheckCircle2}
          positive={
            goals.length > 0 &&
            goalsSummary.completedCount === goals.length
          }
        />
      </section>

      <section
        className="panel stage3-panel"
        aria-labelledby={`${headingId}-title`}
      >
        <div className="panel-heading">
          <div>
            <h3 id={`${headingId}-title`}>Savings goals</h3>
            <p>
              Contributions and withdrawals update progress immediately. They
              are kept separate from income and expense totals.
            </p>
          </div>
          {goals.length > 0 && (
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

        {goals.length === 0 ? (
          <div className="txn-empty tx-empty-large">
            <Goal size={22} aria-hidden="true" />
            <p>
              No savings goals yet. Create one to set a target, track what you
              have saved and see how much is still needed.
            </p>
            <button
              type="button"
              className="button button-primary button-small"
              onClick={openCreate}
            >
              <Plus size={15} aria-hidden="true" />
              Create goal
            </button>
          </div>
        ) : (
          <ul className="goal-grid">
            {progress.map((item) => {
              const datePassed =
                Boolean(item.goal.targetDate) &&
                item.goal.targetDate! < today &&
                !item.isComplete;
              const percentLabel =
                item.rawPercent >= 999
                  ? "999%+"
                  : `${Math.round(item.rawPercent)}%`;

              return (
                <li
                  className={`goal-card${item.isComplete ? " goal-card-complete" : ""}`}
                  key={item.goal.id}
                >
                  <div className="goal-card-head">
                    <div className="goal-title-wrap">
                      <span className="goal-icon" aria-hidden="true">
                        <Goal size={16} />
                      </span>
                      <div>
                        <div className="goal-title-row">
                          <h4 className="goal-title">{item.goal.name}</h4>
                          {item.goal.isDemo && (
                            <span className="data-badge">Sample goal</span>
                          )}
                        </div>
                        {item.goal.description && (
                          <p className="goal-description">
                            {item.goal.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`goal-status${
                        item.isComplete ? " goal-status-complete" : ""
                      }`}
                    >
                      {item.isComplete ? "Complete" : "In progress"}
                    </span>
                  </div>

                  <div className="goal-figures">
                    <div>
                      <span>Target</span>
                      <strong>{formatINR(item.targetAmount)}</strong>
                    </div>
                    <div>
                      <span>Saved</span>
                      <strong>{formatINR(item.savedAmount)}</strong>
                    </div>
                    <div>
                      <span>
                        {item.isComplete ? "Over target" : "Remaining"}
                      </span>
                      <strong
                        className={
                          item.isComplete ? "text-positive" : undefined
                        }
                      >
                        {item.isComplete
                          ? formatINR(item.overTargetBy)
                          : formatINR(item.remaining)}
                      </strong>
                    </div>
                  </div>

                  <div className="goal-usage-head">
                    <span>Progress</span>
                    <span>
                      {percentLabel} of {formatINR(item.targetAmount)}
                    </span>
                  </div>
                  <div
                    className="goal-track"
                    role="progressbar"
                    aria-label={`${item.goal.name}: ${formatINR(
                      item.savedAmount,
                    )} saved of ${formatINR(item.targetAmount)}`}
                    aria-valuemin={0}
                    aria-valuemax={item.targetAmount}
                    aria-valuenow={Math.min(
                      item.savedAmount,
                      item.targetAmount,
                    )}
                    aria-valuetext={`${Math.round(item.percentComplete)}% complete`}
                  >
                    <div
                      className={`goal-fill${
                        item.isComplete ? " goal-fill-complete" : ""
                      }`}
                      style={{ width: `${item.percentComplete}%` }}
                    />
                  </div>

                  <div className="goal-note-row">
                    {item.goal.targetDate ? (
                      <p className="goal-date">
                        <CalendarDays size={12} aria-hidden="true" />
                        Target date {formatTransactionDate(item.goal.targetDate)}
                      </p>
                    ) : (
                      <p className="goal-date">No target date set</p>
                    )}
                    {datePassed && (
                      <p className="goal-date-warning">
                        <AlertTriangle size={12} aria-hidden="true" />
                        Target date has passed
                      </p>
                    )}
                    {item.isComplete && (
                      <p className="goal-date-complete">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        Target reached
                      </p>
                    )}
                  </div>

                  <div className="goal-card-actions">
                    <button
                      type="button"
                      className="button button-primary button-small"
                      onClick={() =>
                        setActivity({ goal: item.goal, mode: "contribute" })
                      }
                      aria-label={`Add money to ${item.goal.name}`}
                    >
                      <Plus size={14} aria-hidden="true" />
                      Add money
                    </button>
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() =>
                        setActivity({ goal: item.goal, mode: "withdraw" })
                      }
                      disabled={item.savedAmount <= 0}
                      aria-label={`Withdraw from ${item.goal.name}`}
                    >
                      Withdraw
                    </button>
                    <button
                      type="button"
                      className="icon-action"
                      onClick={() => openEdit(item.goal)}
                      aria-label={`Edit ${item.goal.name}`}
                      title="Edit goal"
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-action icon-action-danger"
                      onClick={() => setDeleteTarget(item.goal)}
                      aria-label={`Delete ${item.goal.name}`}
                      title="Delete goal"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="goal-footnote">
          Goal progress is self-reported. It is not a bank balance, and it does
          not change your income or expense totals.
        </p>
      </section>

      {formMode && (
        <GoalFormModal
          mode={formMode}
          initial={formMode === "edit" ? editingGoal ?? undefined : undefined}
          onClose={() => {
            setFormMode(null);
            setEditingGoal(null);
          }}
          onSuccess={(message) => setFeedback(message)}
        />
      )}

      {activity && (
        <GoalActivityModal
          goal={activity.goal}
          mode={activity.mode}
          availableToAllocate={availableToAllocate}
          onClose={() => setActivity(null)}
          onSuccess={(message) => setFeedback(message)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this savings goal?"
          description={`Delete “${deleteTarget.name}” and its saved progress of ${formatINR(
            deleteTarget.savedAmount,
          )}? This cannot be undone. Your transactions and budgets are not changed.`}
          confirmLabel="Delete goal"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            deleteGoal(deleteTarget.id);
            setDeleteTarget(null);
            setFeedback("Savings goal deleted.");
          }}
        />
      )}
    </div>
  );
}
