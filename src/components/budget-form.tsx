"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal, ModalHeader } from "@/components/modal";
import {
  CATEGORIES,
  parsePositiveAmount,
  validateBudgetLimit,
} from "@/lib/finance";
import type { Budget, Category } from "@/lib/finance";
import { upsertBudget } from "@/lib/finance-store";

type BudgetFormModalProps = {
  mode: "create" | "edit";
  initial?: Budget;
  availableCategories: Category[];
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function BudgetFormModal({
  mode,
  initial,
  availableCategories,
  onClose,
  onSuccess,
}: BudgetFormModalProps) {
  const formId = useId();
  const limitRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category>(
    initial?.category ?? availableCategories[0] ?? "Food",
  );
  const [limit, setLimit] = useState(initial ? String(initial.limit) : "");
  const [categoryError, setCategoryError] = useState("");
  const [limitError, setLimitError] = useState("");
  const [formError, setFormError] = useState("");

  const title = mode === "edit" ? "Edit budget" : "Create budget";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextCategoryError =
      mode === "create" && !availableCategories.includes(category)
        ? "This category already has a budget. Edit it instead."
        : "";
    const nextLimitError = validateBudgetLimit(limit);

    setCategoryError(nextCategoryError);
    setLimitError(nextLimitError ?? "");

    if (nextCategoryError || nextLimitError) {
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    const parsedLimit = parsePositiveAmount(limit);

    if (parsedLimit === null) {
      setLimitError("Enter a monthly limit greater than zero.");
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    upsertBudget(category, parsedLimit);
    onSuccess?.(
      mode === "edit"
        ? `${category} budget updated.`
        : `${category} budget created.`,
    );
    onClose();
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy={`${formId}-title`}
      describedBy={`${formId}-description`}
      initialFocusRef={limitRef}
    >
      <ModalHeader
        titleId={`${formId}-title`}
        title={title}
        description="Budgets only track expense transactions. Income is ignored."
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
          <label htmlFor={`${formId}-category`}>Category</label>
          <select
            id={`${formId}-category`}
            className="form-select"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as Category);
              setCategoryError("");
              setFormError("");
            }}
            disabled={mode === "edit"}
            aria-invalid={categoryError ? true : undefined}
            aria-describedby={
              categoryError ? `${formId}-category-error` : undefined
            }
          >
            {(mode === "edit" ? CATEGORIES : availableCategories).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {mode === "edit" && (
            <p className="field-hint">
              To move this limit to another category, delete it and create a new
              budget.
            </p>
          )}
          {categoryError && (
            <p className="field-error" id={`${formId}-category-error`}>
              {categoryError}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-limit`}>Monthly limit (INR)</label>
          <input
            ref={limitRef}
            id={`${formId}-limit`}
            className="form-input"
            value={limit}
            onChange={(event) => {
              setLimit(event.target.value);
              setLimitError("");
              setFormError("");
            }}
            type="number"
            min="0.01"
            max="10000000"
            step="0.01"
            inputMode="decimal"
            placeholder="e.g. 1800"
            aria-invalid={limitError ? true : undefined}
            aria-describedby={limitError ? `${formId}-limit-error` : undefined}
          />
          {limitError && (
            <p className="field-error" id={`${formId}-limit-error`}>
              {limitError}
            </p>
          )}
        </div>

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
            className="button button-primary button-small"
          >
            {mode === "edit" ? "Save changes" : "Create budget"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
