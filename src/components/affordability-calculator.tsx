"use client";

import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Info,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  calculateAffordability,
  formatINR,
  parseNonNegativeAmount,
  parseOptionalAmount,
  parsePositiveAmount,
  validateAffordabilityDraft,
} from "@/lib/finance";
import type {
  AffordabilityDraft,
  AffordabilityField,
} from "@/lib/finance";

const EMPTY_DRAFT: AffordabilityDraft = {
  itemName: "",
  price: "",
  availableBalance: "",
  essentialExpenses: "",
  protectedSavings: "",
};

export function AffordabilityCalculator() {
  const formId = useId();
  const [draft, setDraft] = useState<AffordabilityDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateAffordabilityDraft(draft), [draft]);

  const result = useMemo(() => {
    const price = parsePositiveAmount(draft.price);
    const availableBalance = parseNonNegativeAmount(draft.availableBalance);
    const essentialExpenses = parseOptionalAmount(draft.essentialExpenses);
    const protectedSavings = parseOptionalAmount(draft.protectedSavings);

    if (
      price === null ||
      availableBalance === null ||
      essentialExpenses === null ||
      protectedSavings === null ||
      Object.keys(errors).length > 0
    ) {
      return null;
    }

    return calculateAffordability({
      price,
      availableBalance,
      essentialExpenses,
      protectedSavings,
    });
  }, [
    draft.price,
    draft.availableBalance,
    draft.essentialExpenses,
    draft.protectedSavings,
    errors,
  ]);

  function updateField(field: AffordabilityField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
  }

  const showErrors = submitted && Object.keys(errors).length > 0;
  const errorProps = (field: AffordabilityField, fieldId: string) => ({
    id: fieldId,
    "aria-invalid": showErrors && errors[field] ? true : undefined,
    "aria-describedby":
      showErrors && errors[field] ? `${fieldId}-error` : undefined,
  });

  return (
    <section
      className="panel stage3-panel affordability-panel"
      aria-labelledby={`${formId}-title`}
    >
      <div className="panel-heading">
        <div>
          <h3 id={`${formId}-title`}>Affordability calculator</h3>
          <p>
            Test one purchase against the money you have available, without
            connecting to a bank.
          </p>
        </div>
      </div>

      <div className="affordability-formula-box">
        <Calculator size={16} aria-hidden="true" />
        <p>
          <strong>Available for discretionary spending</strong> = available
          balance − essential expenses due − protected savings.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {showErrors && (
          <p className="form-error" role="alert">
            <AlertTriangle size={14} aria-hidden="true" />
            Please fix the highlighted fields to calculate an estimate.
          </p>
        )}

        <div className="affordability-form-grid">
          <div className="form-field affordability-name">
            <label htmlFor={`${formId}-field-name`}>Item or purchase name</label>
            <input
              {...errorProps("itemName", `${formId}-field-name`)}
              className="form-input"
              value={draft.itemName}
              onChange={(event) => updateField("itemName", event.target.value)}
              maxLength={80}
              placeholder="e.g. Second-hand bicycle"
              autoComplete="off"
            />
            {showErrors && errors.itemName && (
              <p className="field-error" id={`${formId}-field-name-error`}>
                {errors.itemName}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-field-price`}>Purchase price (INR)</label>
            <input
              {...errorProps("price", `${formId}-field-price`)}
              className="form-input"
              value={draft.price}
              onChange={(event) => updateField("price", event.target.value)}
              type="number"
              min="0.01"
              max="10000000"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 2500"
            />
            {showErrors && errors.price && (
              <p className="field-error" id={`${formId}-field-price-error`}>
                {errors.price}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-field-balance`}>
              Available balance (INR)
            </label>
            <input
              {...errorProps("availableBalance", `${formId}-field-balance`)}
              className="form-input"
              value={draft.availableBalance}
              onChange={(event) =>
                updateField("availableBalance", event.target.value)
              }
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 6000"
            />
            {showErrors && errors.availableBalance && (
              <p className="field-error" id={`${formId}-field-balance-error`}>
                {errors.availableBalance}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-field-essentials`}>
              Essential expenses due{" "}
              <span className="label-optional">(optional)</span>
            </label>
            <input
              {...errorProps("essentialExpenses", `${formId}-field-essentials`)}
              className="form-input"
              value={draft.essentialExpenses}
              onChange={(event) =>
                updateField("essentialExpenses", event.target.value)
              }
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
            />
            {showErrors && errors.essentialExpenses && (
              <p className="field-error" id={`${formId}-field-essentials-error`}>
                {errors.essentialExpenses}
              </p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-field-protected`}>
              Protected savings{" "}
              <span className="label-optional">(optional)</span>
            </label>
            <input
              {...errorProps("protectedSavings", `${formId}-field-protected`)}
              className="form-input"
              value={draft.protectedSavings}
              onChange={(event) =>
                updateField("protectedSavings", event.target.value)
              }
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
            />
            {showErrors && errors.protectedSavings && (
              <p className="field-error" id={`${formId}-field-protected-error`}>
                {errors.protectedSavings}
              </p>
            )}
          </div>
        </div>

        <div className="affordability-actions">
          <button type="submit" className="button button-primary button-small">
            <Calculator size={15} aria-hidden="true" />
            Calculate estimate
          </button>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={reset}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </button>
        </div>
      </form>

      {submitted && result && (
        <div
          className={`affordability-result ${
            result.fits
              ? "affordability-result-fits"
              : "affordability-result-short"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="affordability-result-head">
            {result.fits ? (
              <CheckCircle2 size={18} aria-hidden="true" />
            ) : (
              <AlertTriangle size={18} aria-hidden="true" />
            )}
            <div>
              <h4>
                {result.fits
                  ? `“${draft.itemName.trim()}” fits this entered budget.`
                  : `“${draft.itemName.trim()}” does not fit this entered budget.`}
              </h4>
              <p>
                {result.fits
                  ? "The price is within the amount left after essentials and protected savings."
                  : "The price is higher than the amount left after essentials and protected savings."}
              </p>
            </div>
          </div>

          <dl className="affordability-figures">
            <div>
              <dt>Available for discretionary spending</dt>
              <dd>{formatINR(result.discretionary)}</dd>
            </div>
            <div>
              <dt>Remaining after purchase</dt>
              <dd
                className={
                  result.remainingAfterPurchase >= 0
                    ? "text-positive"
                    : "text-negative"
                }
              >
                {formatINR(result.remainingAfterPurchase)}
              </dd>
            </div>
          </dl>

          {!result.fits && (
            <p className="affordability-shortfall">
              <AlertTriangle size={13} aria-hidden="true" />
              This purchase is {formatINR(result.shortfall)} more than the
              available amount.
            </p>
          )}

          <div className="affordability-explanation">
            <p>
              <strong>Calculation:</strong>{" "}
              {formatINR(Number(draft.availableBalance))} available balance −{" "}
              {formatINR(Number(draft.essentialExpenses || 0))} essential
              expenses − {formatINR(Number(draft.protectedSavings || 0))}{" "}
              protected savings = {formatINR(result.discretionary)} available.
            </p>
            <p>
              {formatINR(result.discretionary)} available −{" "}
              {formatINR(Number(draft.price))} purchase price ={" "}
              {formatINR(result.remainingAfterPurchase)} remaining.
            </p>
          </div>

          <p className="educational-note">
            <Info size={13} aria-hidden="true" />
            Educational estimate only. It uses the numbers you enter and does
            not check a bank balance. It is not a guarantee that a purchase is
            affordable and is not professional financial advice.
          </p>
        </div>
      )}

      {!submitted && (
        <p className="educational-note">
          <ShieldCheck size={13} aria-hidden="true" />
          Educational estimate only. Nothing is sent to a server. It uses the
          numbers you enter and is not a guarantee of affordability or
          professional financial advice.
        </p>
      )}
    </section>
  );
}
