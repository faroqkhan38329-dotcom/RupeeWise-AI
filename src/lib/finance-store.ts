"use client";

import { useSyncExternalStore } from "react";
import {
  FINANCE_STORAGE_KEY,
  loadFinanceState,
  saveFinanceState,
} from "@/lib/finance-storage";
import type { StorageAvailability } from "@/lib/finance-storage";
import {
  MAX_GOAL_AMOUNT,
  createDemoData,
  createGoalId,
  createTransactionId,
  roundAmount,
} from "@/lib/finance";
import type {
  Budget,
  Category,
  FinanceData,
  SavingsGoal,
  Transaction,
} from "@/lib/finance";

export type FinanceSnapshot = {
  data: FinanceData;
  hydrated: boolean;
  storage: StorageAvailability;
  notice: string | null;
  persistenceError: string | null;
};

const SERVER_SNAPSHOT: FinanceSnapshot = {
  data: createDemoData(),
  hydrated: false,
  storage: "ready",
  notice: null,
  persistenceError: null,
};

let snapshot: FinanceSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let storageListenerAttached = false;

function setSnapshot(next: FinanceSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === "undefined") return;

  storageListenerAttached = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== FINANCE_STORAGE_KEY) return;

    const result = loadFinanceState();
    setSnapshot({
      ...snapshot,
      data: result.data,
      hydrated: true,
      storage: result.storage,
      notice: result.notice,
    });
  });
}

function ensureHydrated() {
  if (snapshot.hydrated || typeof window === "undefined") return;

  const result = loadFinanceState();
  setSnapshot({
    data: result.data,
    hydrated: true,
    storage: result.storage,
    notice: result.notice,
    persistenceError: null,
  });
  attachStorageListener();
}

function commit(data: FinanceData) {
  ensureHydrated();
  const persistenceError = saveFinanceState(data);
  setSnapshot({
    ...snapshot,
    data,
    hydrated: true,
    notice: null,
    persistenceError,
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureHydrated();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function useFinanceStore(): FinanceSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type TransactionInput = Omit<Transaction, "id" | "isDemo">;

export function addTransaction(input: TransactionInput): Transaction {
  ensureHydrated();

  const transaction: Transaction = {
    ...input,
    amount: roundAmount(input.amount),
    description: input.description.trim(),
    notes: input.notes?.trim() || undefined,
    id: createTransactionId(),
    isDemo: false,
  };

  commit({
    ...snapshot.data,
    transactions: [transaction, ...snapshot.data.transactions],
  });

  return transaction;
}

export function updateTransaction(
  id: string,
  input: TransactionInput,
): boolean {
  ensureHydrated();

  const exists = snapshot.data.transactions.some(
    (transaction) => transaction.id === id,
  );

  if (!exists) return false;

  commit({
    ...snapshot.data,
    transactions: snapshot.data.transactions.map((transaction) =>
      transaction.id === id
        ? {
            ...transaction,
            ...input,
            amount: roundAmount(input.amount),
            description: input.description.trim(),
            notes: input.notes?.trim() || undefined,
            isDemo: false,
          }
        : transaction,
    ),
  });

  return true;
}

export function deleteTransaction(id: string) {
  ensureHydrated();

  commit({
    ...snapshot.data,
    transactions: snapshot.data.transactions.filter(
      (transaction) => transaction.id !== id,
    ),
  });
}

export function upsertBudget(category: Category, limit: number) {
  ensureHydrated();

  const nextBudget: Budget = {
    category,
    limit: roundAmount(limit),
    isDemo: false,
  };
  const exists = snapshot.data.budgets.some(
    (budget) => budget.category === category,
  );

  commit({
    ...snapshot.data,
    budgets: exists
      ? snapshot.data.budgets.map((budget) =>
          budget.category === category ? nextBudget : budget,
        )
      : [...snapshot.data.budgets, nextBudget],
  });
}

export function deleteBudget(category: Category) {
  ensureHydrated();

  commit({
    ...snapshot.data,
    budgets: snapshot.data.budgets.filter(
      (budget) => budget.category !== category,
    ),
  });
}

export type GoalInput = Omit<SavingsGoal, "id" | "isDemo">;

function normalizeGoalInput(input: GoalInput): GoalInput {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    targetAmount: roundAmount(input.targetAmount),
    savedAmount: roundAmount(input.savedAmount),
    targetDate: input.targetDate || undefined,
  };
}

export function addGoal(input: GoalInput): SavingsGoal {
  ensureHydrated();

  const goal: SavingsGoal = {
    ...normalizeGoalInput(input),
    id: createGoalId(),
    isDemo: false,
  };

  commit({
    ...snapshot.data,
    goals: [goal, ...snapshot.data.goals],
  });

  return goal;
}

export function updateGoal(id: string, input: GoalInput): boolean {
  ensureHydrated();

  const exists = snapshot.data.goals.some((goal) => goal.id === id);

  if (!exists) return false;

  commit({
    ...snapshot.data,
    goals: snapshot.data.goals.map((goal) =>
      goal.id === id
        ? {
            ...goal,
            ...normalizeGoalInput(input),
            isDemo: false,
          }
        : goal,
    ),
  });

  return true;
}

export function deleteGoal(id: string) {
  ensureHydrated();

  commit({
    ...snapshot.data,
    goals: snapshot.data.goals.filter((goal) => goal.id !== id),
  });
}

export function adjustGoalSavedAmount(
  id: string,
  delta: number,
): SavingsGoal | null {
  ensureHydrated();

  const goal = snapshot.data.goals.find((item) => item.id === id);

  if (!goal || !Number.isFinite(delta) || delta === 0) return null;

  const savedAmount = roundAmount(goal.savedAmount + delta);

  if (savedAmount < 0 || savedAmount > MAX_GOAL_AMOUNT) return null;

  const updated: SavingsGoal = {
    ...goal,
    savedAmount,
    isDemo: false,
  };

  commit({
    ...snapshot.data,
    goals: snapshot.data.goals.map((item) =>
      item.id === id ? updated : item,
    ),
  });

  return updated;
}

export function resetFinanceData() {
  ensureHydrated();
  commit(createDemoData());
}
