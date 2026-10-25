"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Modal, ModalHeader } from "@/components/modal";
import {
  CATEGORIES,
  getTodayISO,
  parsePositiveAmount,
  validateTransactionDraft,
} from "@/lib/finance";
import { addTransaction, updateTransaction } from "@/lib/finance-store";
import type {
  Category,
  Transaction,
  TransactionDraft,
  TransactionErrors,
  TransactionField,
  TransactionType,
} from "@/lib/finance";

type TransactionFormModalProps = {
  mode: "create" | "edit";
  initial?: Transaction;
  allowIncome?: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
};

export function TransactionFormModal({
  mode,
  initial,
  allowIncome = true,
  onClose,
  onSuccess,
}: TransactionFormModalProps) {
  const formId = useId();
  const descriptionRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : "",
  );
  const [type, setType] = useState<TransactionType>(
    allowIncome ? (initial?.type ?? "expense") : "expense",
  );
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "Food",
  );
  const [date, setDate] = useState(initial?.date ?? getTodayISO());
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<TransactionErrors>({});
  const [formError, setFormError] = useState("");

  const title =
    mode === "edit"
      ? "Edit transaction"
      : allowIncome
        ? "Add transaction"
        : "Add expense";
  const submitLabel =
    mode === "edit" ? "Save changes" : allowIncome ? "Add transaction" : "Add expense";

  function clearError(field: TransactionField) {
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

    const draft: TransactionDraft = {
      description,
      amount,
      type,
      category,
      date,
      notes,
    };
    const nextErrors = validateTransactionDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    const parsedAmount = parsePositiveAmount(amount);

    if (parsedAmount === null) {
      setErrors({ amount: "Enter an amount greater than zero." });
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    const payload = {
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      date,
      notes: notes.trim() || undefined,
    };

    if (mode === "edit" && initial) {
      updateTransaction(initial.id, payload);
      onSuccess?.("Transaction updated.");
    } else {
      addTransaction(payload);
      onSuccess?.("Transaction added.");
    }

    onClose();
  }

  const errorProps = (field: TransactionField, fieldId: string) => ({
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
      initialFocusRef={descriptionRef}
    >
      <ModalHeader
        titleId={`${formId}-title`}
        title={title}
        description="Saved only in this browser. Nothing is sent to a server."
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

        {allowIncome && (
          <div className="form-field">
            <span className="field-label" id={`${formId}-type-label`}>
              Type
            </span>
            <div
              className="type-toggle"
              role="group"
              aria-labelledby={`${formId}-type-label`}
            >
              <button
                type="button"
                className={`type-option${type === "expense" ? " type-option-active type-option-expense" : ""}`}
                aria-pressed={type === "expense"}
                onClick={() => {
                  setType("expense");
                  clearError("type");
                }}
              >
                Expense
              </button>
              <button
                type="button"
                className={`type-option${type === "income" ? " type-option-active type-option-income" : ""}`}
                aria-pressed={type === "income"}
                onClick={() => {
                  setType("income");
                  clearError("type");
                }}
              >
                Income
              </button>
            </div>
            {errors.type && <p className="field-error">{errors.type}</p>}
          </div>
        )}

        <div className="form-field">
          <label htmlFor={`${formId}-field-description`}>Description</label>
          <input
            ref={descriptionRef}
            {...errorProps("description", `${formId}-field-description`)}
            className="form-input"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearError("description");
            }}
            maxLength={80}
            placeholder="e.g. Canteen lunch"
            autoComplete="off"
          />
          {errors.description && (
            <p className="field-error" id={`${formId}-field-description-error`}>
              {errors.description}
            </p>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor={`${formId}-field-amount`}>Amount (INR)</label>
            <input
              {...errorProps("amount", `${formId}-field-amount`)}
              className="form-input"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                clearError("amount");
              }}
              type="number"
              min="0.01"
              max="10000000"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 150"
            />
            {errors.amount && (
              <p className="field-error" id={`${formId}-field-amount-error`}>
                {errors.amount}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-field-category`}>Category</label>
            <select
              {...errorProps("category", `${formId}-field-category`)}
              className="form-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as Category);
                clearError("category");
              }}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="field-error" id={`${formId}-field-category-error`}>
                {errors.category}
              </p>
            )}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-field-date`}>Date</label>
          <input
            {...errorProps("date", `${formId}-field-date`)}
            className="form-input"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              clearError("date");
            }}
            type="date"
          />
          {errors.date && (
            <p className="field-error" id={`${formId}-field-date-error`}>
              {errors.date}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-field-notes`}>
            Notes <span className="label-optional">(optional)</span>
          </label>
          <textarea
            {...errorProps("notes", `${formId}-field-notes`)}
            className="form-input form-textarea"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              clearError("notes");
            }}
            maxLength={200}
            rows={2}
            placeholder="Anything you want to remember"
          />
          {errors.notes && (
            <p className="field-error" id={`${formId}-field-notes-error`}>
              {errors.notes}
            </p>
          )}
        </div>

        <p className="form-privacy-note">
          <Info size={13} aria-hidden="true" />
          Never enter UPI PINs, OTPs, card numbers or banking passwords.
        </p>

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
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
