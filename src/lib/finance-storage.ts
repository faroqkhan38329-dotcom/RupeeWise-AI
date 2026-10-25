import {
  CATEGORIES,
  MAX_BUDGET_LIMIT,
  MAX_DESCRIPTION_LENGTH,
  MAX_GOAL_AMOUNT,
  MAX_GOAL_DESCRIPTION_LENGTH,
  MAX_GOAL_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_TRANSACTION_AMOUNT,
  createDemoData,
  isValidISODate,
  roundAmount,
} from "@/lib/finance";
import type {
  Budget,
  Category,
  FinanceData,
  SavingsGoal,
  Transaction,
} from "@/lib/finance";

export const FINANCE_STORAGE_KEY = "rupeewise.finance.v1";
export const FINANCE_STORAGE_VERSION = 2;

const MAX_STORED_TRANSACTIONS = 5000;
const MAX_STORED_BUDGETS = 50;
const MAX_STORED_GOALS = 200;

export type StorageAvailability = "ready" | "unavailable";

export type LoadFinanceResult = {
  data: FinanceData;
  notice: string | null;
  storage: StorageAvailability;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.includes(value as Category);
}

function sanitizeTransaction(value: unknown): Transaction | null {
  if (!isRecord(value)) return null;

  const { id, description, amount, type, category, date, notes } = value;

  if (typeof id !== "string" || !id.trim() || id.length > 120) return null;
  if (typeof description !== "string") return null;

  const safeDescription = description.trim();

  if (
    !safeDescription ||
    safeDescription.length > MAX_DESCRIPTION_LENGTH
  ) {
    return null;
  }

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_TRANSACTION_AMOUNT
  ) {
    return null;
  }

  if (type !== "income" && type !== "expense") return null;
  if (!isCategory(category)) return null;
  if (typeof date !== "string" || !isValidISODate(date)) return null;

  const safeNotes =
    typeof notes === "string"
      ? notes.trim().slice(0, MAX_NOTES_LENGTH)
      : undefined;

  return {
    id,
    description: safeDescription,
    amount: roundAmount(amount),
    type,
    category,
    date,
    ...(safeNotes ? { notes: safeNotes } : {}),
    isDemo: value.isDemo === true,
  };
}

function sanitizeBudget(value: unknown): Budget | null {
  if (!isRecord(value)) return null;

  const { category, limit } = value;

  if (!isCategory(category)) return null;
  if (
    typeof limit !== "number" ||
    !Number.isFinite(limit) ||
    limit <= 0 ||
    limit > MAX_BUDGET_LIMIT
  ) {
    return null;
  }

  return {
    category,
    limit: roundAmount(limit),
    isDemo: value.isDemo === true,
  };
}

function sanitizeGoal(value: unknown): SavingsGoal | null {
  if (!isRecord(value)) return null;

  const { id, name, description, targetAmount, savedAmount, targetDate } =
    value;

  if (typeof id !== "string" || !id.trim() || id.length > 120) return null;
  if (typeof name !== "string") return null;

  const safeName = name.trim();

  if (!safeName || safeName.length > MAX_GOAL_NAME_LENGTH) return null;

  if (
    typeof targetAmount !== "number" ||
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0 ||
    targetAmount > MAX_GOAL_AMOUNT
  ) {
    return null;
  }

  const roundedTarget = roundAmount(targetAmount);

  if (roundedTarget <= 0) {
    return null;
  }

  if (
    savedAmount !== undefined &&
    (typeof savedAmount !== "number" ||
      !Number.isFinite(savedAmount) ||
      savedAmount < 0 ||
      savedAmount > MAX_GOAL_AMOUNT)
  ) {
    return null;
  }

  if (
    targetDate !== undefined &&
    targetDate !== "" &&
    (typeof targetDate !== "string" || !isValidISODate(targetDate))
  ) {
    return null;
  }

  const safeDescription =
    typeof description === "string"
      ? description.trim().slice(0, MAX_GOAL_DESCRIPTION_LENGTH)
      : "";
  const safeTargetDate =
    typeof targetDate === "string" && targetDate ? targetDate : undefined;

  return {
    id,
    name: safeName,
    ...(safeDescription ? { description: safeDescription } : {}),
    targetAmount: roundedTarget,
    savedAmount:
      typeof savedAmount === "number" ? roundAmount(savedAmount) : 0,
    ...(safeTargetDate ? { targetDate: safeTargetDate } : {}),
    isDemo: value.isDemo === true,
  };
}

export function parseStoredFinance(raw: string): LoadFinanceResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      data: createDemoData(),
      notice:
        "Saved data could not be read, so the fictional demo dataset was restored.",
      storage: "ready",
    };
  }

  if (
    !isRecord(parsed) ||
    (parsed.version !== 1 &&
      parsed.version !== FINANCE_STORAGE_VERSION) ||
    !Array.isArray(parsed.transactions) ||
    !Array.isArray(parsed.budgets)
  ) {
    return {
      data: createDemoData(),
      notice:
        "Saved data was missing or from an unsupported version, so the fictional demo dataset was restored.",
      storage: "ready",
    };
  }

  const storedTransactions = parsed.transactions.slice(
    0,
    MAX_STORED_TRANSACTIONS,
  );
  const storedBudgets = parsed.budgets.slice(0, MAX_STORED_BUDGETS);
  const storedGoals =
    parsed.version === FINANCE_STORAGE_VERSION && Array.isArray(parsed.goals)
      ? parsed.goals.slice(0, MAX_STORED_GOALS)
      : [];

  const transactions: Transaction[] = [];
  const seenTransactionIds = new Set<string>();

  for (const candidate of storedTransactions) {
    const transaction = sanitizeTransaction(candidate);

    if (!transaction || seenTransactionIds.has(transaction.id)) continue;

    seenTransactionIds.add(transaction.id);
    transactions.push(transaction);
  }

  const budgetMap = new Map<Category, Budget>();

  for (const candidate of storedBudgets) {
    const budget = sanitizeBudget(candidate);

    if (budget) budgetMap.set(budget.category, budget);
  }

  const goals: SavingsGoal[] = [];
  const seenGoalIds = new Set<string>();

  for (const candidate of storedGoals) {
    const goal = sanitizeGoal(candidate);

    if (!goal || seenGoalIds.has(goal.id)) continue;

    seenGoalIds.add(goal.id);
    goals.push(goal);
  }

  const budgets = [...budgetMap.values()];
  const skipped =
    parsed.transactions.length -
    transactions.length +
    (parsed.budgets.length - budgets.length) +
    (storedGoals.length - goals.length);

  return {
    data: { transactions, budgets, goals },
    notice:
      skipped > 0
        ? "Some saved entries could not be read and were skipped."
        : null,
    storage: "ready",
  };
}

export function loadFinanceState(): LoadFinanceResult {
  if (typeof window === "undefined") {
    return {
      data: createDemoData(),
      notice: null,
      storage: "unavailable",
    };
  }

  let raw: string | null;

  try {
    raw = window.localStorage.getItem(FINANCE_STORAGE_KEY);
  } catch {
    return {
      data: createDemoData(),
      notice:
        "Browser storage is unavailable, so changes cannot be saved in this browser.",
      storage: "unavailable",
    };
  }

  if (raw === null) {
    return {
      data: createDemoData(),
      notice: null,
      storage: "ready",
    };
  }

  return parseStoredFinance(raw);
}

export function saveFinanceState(data: FinanceData): string | null {
  if (typeof window === "undefined") {
    return "Browser storage is unavailable, so changes cannot be saved.";
  }

  try {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        version: FINANCE_STORAGE_VERSION,
        transactions: data.transactions,
        budgets: data.budgets,
        goals: data.goals,
      }),
    );
    return null;
  } catch {
    return "This browser blocked local saving (storage may be full or disabled). Changes will be lost on refresh.";
  }
}
