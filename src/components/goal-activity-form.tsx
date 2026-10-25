"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Modal, ModalHeader } from "@/components/modal";
import {
  MAX_GOAL_AMOUNT,
  formatINR,
  getGoalProgress,
  parsePositiveAmount,
  validateGoalActivityDraft,
} from "@/lib/finance";
import type {
  GoalActivityErrors,
  GoalActivityField,
  GoalActivityMode,
  SavingsGoal,
} from "@/lib/finance";
import { adjustGoalSavedAmount } from "@/lib/finance-store";

type GoalActivityModalProps = {
  goal: SavingsGoal;
  mode: GoalActivityMode;
  availableToAllocate: number;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function GoalActivityModal({
  goal,
  mode,
  availableToAllocate,
  onClose,
  onSuccess,
}: GoalActivityModalProps) {
  const formId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<GoalActivityErrors>({});
  const [formError, setFormError] = useState("");
  const progress = getGoalProgress(goal);
  const parsedAmount = parsePositiveAmount(amount);
  const contributionWarning =
    mode === "contribute" &&
    parsedAmount !== null &&
    parsedAmount > Math.max(availableToAllocate, 0);

  function clearError(field: GoalActivityField) {
    setFormError("");
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateGoalActivityDraft({ mode, amount }, goal);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    const parsed = parsePositiveAmount(amount);

    if (parsed === null) {
      setErrors({ amount: "Enter an amount greater than zero." });
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    const updated = adjustGoalSavedAmount(
      goal.id,
      mode === "contribute" ? parsed : -parsed,
    );

    if (!updated) {
      setFormError("This change could not be saved. Refresh and try again.");
      return;
    }

    onSuccess?.(
      mode === "contribute"
        ? `${formatINR(parsed)} added to ${goal.name}.`
        : `${formatINR(parsed)} withdrawn from ${goal.name}.`,
    );
    onClose();
  }

  const title =
    mode === "contribute" ? `Add money to ${goal.name}` : `Withdraw from ${goal.name}`;
  const submitLabel = mode === "contribute" ? "Add to goal" : "Withdraw";

  return (
    <Modal
      onClose={onClose}
      labelledBy={`${formId}-title`}
      describedBy={`${formId}-description`}
      initialFocusRef={amountRef}
    >
      <ModalHeader
        titleId={`${formId}-title`}
        title={title}
        description="This updates your goal progress only. It does not create a transaction."
        descriptionId={`${formId}-description`}
        onClose={onClose}
      />

      <div className="goal-activity-summary">
        <div>
          <span>Saved now</span>
          <strong>{formatINR(progress.savedAmount)}</strong>
        </div>
        <div>
          <span>Target</span>
          <strong>{formatINR(progress.targetAmount)}</strong>
        </div>
        <div>
          <span>Remaining</span>
          <strong>{formatINR(progress.remaining)}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="form-error" role="alert">
            <AlertTriangle size={14} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className="form-field">
          <label htmlFor={`${formId}-field-amount`}>
            {mode === "contribute" ? "Contribution amount (INR)" : "Withdrawal amount (INR)"}
          </label>
          <input
            ref={amountRef}
            id={`${formId}-field-amount`}
            className="form-input"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              clearError("amount");
            }}
            type="number"
            min="0.01"
            max={
              mode === "withdraw"
                ? Math.max(goal.savedAmount, 0.01)
                : MAX_GOAL_AMOUNT
            }
            step="0.01"
            inputMode="decimal"
            placeholder="e.g. 500"
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={
              errors.amount ? `${formId}-field-amount-error` : undefined
            }
          />
          {errors.amount && (
            <p className="field-error" id={`${formId}-field-amount-error`}>
              {errors.amount}
            </p>
          )}
          {mode === "withdraw" && (
            <p className="field-hint">
              You can withdraw up to {formatINR(goal.savedAmount)}.
            </p>
          )}
        </div>

        {contributionWarning && (
          <p className="form-warning" role="status">
            <AlertTriangle size={14} aria-hidden="true" />
            <span>
              {availableToAllocate < 0
                ? `Your plan has no unallocated balance: goal savings exceed the remaining balance by ${formatINR(
                    Math.abs(availableToAllocate),
                  )}. You can still record this contribution, but it may rely on money outside this plan.`
                : `This is more than the ${formatINR(
                    availableToAllocate,
                  )} available after your current goal savings. You can still record it, but it may rely on money outside this plan.`}
            </span>
          </p>
        )}

        {mode === "contribute" && (
          <p className="form-privacy-note">
            <Info size={13} aria-hidden="true" />
            Available for goals is calculated as remaining balance minus the
            total already marked as saved in all goals.
          </p>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`button button-small ${
              mode === "withdraw" ? "button-secondary" : "button-primary"
            }`}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
