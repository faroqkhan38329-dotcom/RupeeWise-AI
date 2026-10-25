"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Modal, ModalHeader } from "@/components/modal";
import {
  MAX_GOAL_AMOUNT,
  MAX_GOAL_DESCRIPTION_LENGTH,
  MAX_GOAL_NAME_LENGTH,
  parseOptionalAmount,
  parsePositiveAmount,
  validateGoalDraft,
} from "@/lib/finance";
import type { GoalDraft, GoalErrors, GoalField, SavingsGoal } from "@/lib/finance";
import { addGoal, updateGoal } from "@/lib/finance-store";

type GoalFormModalProps = {
  mode: "create" | "edit";
  initial?: SavingsGoal;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function GoalFormModal({
  mode,
  initial,
  onClose,
  onSuccess,
}: GoalFormModalProps) {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [targetAmount, setTargetAmount] = useState(
    initial ? String(initial.targetAmount) : "",
  );
  const [savedAmount, setSavedAmount] = useState(
    initial ? String(initial.savedAmount) : "0",
  );
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? "");
  const [errors, setErrors] = useState<GoalErrors>({});
  const [formError, setFormError] = useState("");

  function clearError(field: GoalField) {
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

    const draft: GoalDraft = {
      name,
      description,
      targetAmount,
      savedAmount,
      targetDate,
    };
    const nextErrors = validateGoalDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    const parsedTarget = parsePositiveAmount(targetAmount);
    const parsedSaved = parseOptionalAmount(savedAmount);

    if (parsedTarget === null || parsedSaved === null) {
      setErrors({
        ...(parsedTarget === null
          ? { targetAmount: "Enter a target amount greater than zero." }
          : {}),
        ...(parsedSaved === null
          ? { savedAmount: "Enter zero or a positive saved amount." }
          : {}),
      });
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      targetAmount: parsedTarget,
      savedAmount: parsedSaved,
      targetDate: targetDate || undefined,
    };

    if (mode === "edit" && initial) {
      updateGoal(initial.id, payload);
      onSuccess?.("Savings goal updated.");
    } else {
      addGoal(payload);
      onSuccess?.("Savings goal created.");
    }

    onClose();
  }

  const errorProps = (field: GoalField, fieldId: string) => ({
    id: fieldId,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${fieldId}-error` : undefined,
  });

  return (
    <Modal
      onClose={onClose}
      labelledBy={`${formId}-title`}
      describedBy={`${formId}-description`}
      size="wide"
      initialFocusRef={nameRef}
    >
      <ModalHeader
        titleId={`${formId}-title`}
        title={mode === "edit" ? "Edit savings goal" : "Create savings goal"}
        description="Saved only in this browser. A goal is a plan, not a bank account."
        descriptionId={`${formId}-description`}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="form-error" role="alert">
            <AlertTriangle size={14} aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className="form-field">
          <label htmlFor={`${formId}-field-name`}>Goal name</label>
          <input
            ref={nameRef}
            {...errorProps("name", `${formId}-field-name`)}
            className="form-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearError("name");
            }}
            maxLength={MAX_GOAL_NAME_LENGTH}
            placeholder="e.g. Laptop fund"
            autoComplete="off"
          />
          {errors.name && (
            <p className="field-error" id={`${formId}-field-name-error`}>
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-field-description`}>
            Description <span className="label-optional">(optional)</span>
          </label>
          <textarea
            {...errorProps("description", `${formId}-field-description`)}
            className="form-input form-textarea"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearError("description");
            }}
            maxLength={MAX_GOAL_DESCRIPTION_LENGTH}
            rows={2}
            placeholder="What are you saving for?"
          />
          {errors.description && (
            <p
              className="field-error"
              id={`${formId}-field-description-error`}
            >
              {errors.description}
            </p>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor={`${formId}-field-target`}>Target amount (INR)</label>
            <input
              {...errorProps("targetAmount", `${formId}-field-target`)}
              className="form-input"
              value={targetAmount}
              onChange={(event) => {
                setTargetAmount(event.target.value);
                clearError("targetAmount");
              }}
              type="number"
              min="0.01"
              max={MAX_GOAL_AMOUNT}
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 15000"
            />
            {errors.targetAmount && (
              <p className="field-error" id={`${formId}-field-target-error`}>
                {errors.targetAmount}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-field-saved`}>Current saved (INR)</label>
            <input
              {...errorProps("savedAmount", `${formId}-field-saved`)}
              className="form-input"
              value={savedAmount}
              onChange={(event) => {
                setSavedAmount(event.target.value);
                clearError("savedAmount");
              }}
              type="number"
              min="0"
              max={MAX_GOAL_AMOUNT}
              step="0.01"
              inputMode="decimal"
              placeholder="0"
            />
            {errors.savedAmount && (
              <p className="field-error" id={`${formId}-field-saved-error`}>
                {errors.savedAmount}
              </p>
            )}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-field-date`}>
            Target date <span className="label-optional">(optional)</span>
          </label>
          <input
            {...errorProps("targetDate", `${formId}-field-date`)}
            className="form-input"
            value={targetDate}
            onChange={(event) => {
              setTargetDate(event.target.value);
              clearError("targetDate");
            }}
            type="date"
          />
          {errors.targetDate && (
            <p className="field-error" id={`${formId}-field-date-error`}>
              {errors.targetDate}
            </p>
          )}
        </div>

        <p className="form-privacy-note">
          <Info size={13} aria-hidden="true" />
          Adding money to a goal does not create an income or expense
          transaction, so it does not change your dashboard totals.
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="button button-primary button-small">
            {mode === "edit" ? "Save changes" : "Create goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
