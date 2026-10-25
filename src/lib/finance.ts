export type TransactionType = "income" | "expense";

export type Category =
  | "Food"
  | "Transport"
  | "Education"
  | "Shopping"
  | "Entertainment"
  | "Bills"
  | "Other";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
  notes?: string;
  isDemo?: boolean;
};

export type Budget = {
  category: Category;
  limit: number;
  isDemo?: boolean;
};

export type SavingsGoal = {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  isDemo?: boolean;
};

export type FinanceData = {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
};

export type BudgetStatus = "safe" | "near" | "over";

export type GoalProgress = {
  goal: SavingsGoal;
  targetAmount: number;
  savedAmount: number;
  remaining: number;
  rawPercent: number;
  percentComplete: number;
  isComplete: boolean;
  overTargetBy: number;
};

export type GoalsSummary = {
  totalTarget: number;
  totalSaved: number;
  totalRemaining: number;
  completedCount: number;
  activeCount: number;
  overallPercent: number | null;
};

export type BudgetProgress = {
  budget: Budget;
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  overBy: number;
  percentUsed: number;
  status: BudgetStatus;
};

export type FinanceSummary = {
  startingAllowance: number;
  income: number;
  expenses: number;
  availableFunds: number;
  remaining: number;
  balanceRate: number | null;
};

export const STARTING_ALLOWANCE = 8000;
export const MAX_TRANSACTION_AMOUNT = 10_000_000;
export const MAX_BUDGET_LIMIT = 10_000_000;
export const MAX_GOAL_AMOUNT = 10_000_000;
export const MAX_DESCRIPTION_LENGTH = 80;
export const MAX_NOTES_LENGTH = 200;
export const MAX_GOAL_NAME_LENGTH = 80;
export const MAX_GOAL_DESCRIPTION_LENGTH = 200;
export const BUDGET_WARNING_PERCENT = 80;

export const CATEGORIES: Category[] = [
  "Food",
  "Transport",
  "Education",
  "Shopping",
  "Entertainment",
  "Bills",
  "Other",
];

export const DEFAULT_BUDGET_LIMITS: Record<Category, number> = {
  Food: 1800,
  Transport: 900,
  Education: 1200,
  Shopping: 1000,
  Entertainment: 700,
  Bills: 600,
  Other: 800,
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "demo-1",
    description: "College canteen lunch",
    amount: 120,
    type: "expense",
    category: "Food",
    date: "2026-10-25",
    isDemo: true,
  },
  {
    id: "demo-2",
    description: "Bus pass top-up",
    amount: 350,
    type: "expense",
    category: "Transport",
    date: "2026-10-25",
    isDemo: true,
  },
  {
    id: "demo-3",
    description: "Notebook and pens",
    amount: 185,
    type: "expense",
    category: "Education",
    date: "2026-10-24",
    isDemo: true,
  },
  {
    id: "demo-4",
    description: "Snacks with friends",
    amount: 95,
    type: "expense",
    category: "Food",
    date: "2026-10-24",
    notes: "Fictional sample entry.",
    isDemo: true,
  },
  {
    id: "demo-5",
    description: "Movie ticket",
    amount: 220,
    type: "expense",
    category: "Entertainment",
    date: "2026-10-22",
    isDemo: true,
  },
  {
    id: "demo-6",
    description: "Winter jacket",
    amount: 1199,
    type: "expense",
    category: "Shopping",
    date: "2026-10-21",
    isDemo: true,
  },
  {
    id: "demo-7",
    description: "Auto ride to campus",
    amount: 160,
    type: "expense",
    category: "Transport",
    date: "2026-10-20",
    isDemo: true,
  },
  {
    id: "demo-8",
    description: "Printing assignment",
    amount: 80,
    type: "expense",
    category: "Education",
    date: "2026-10-19",
    isDemo: true,
  },
  {
    id: "demo-9",
    description: "Scholarship stipend",
    amount: 3000,
    type: "income",
    category: "Education",
    date: "2026-10-05",
    notes: "Fictional sample income.",
    isDemo: true,
  },
  {
    id: "demo-10",
    description: "Weekend tutoring",
    amount: 1200,
    type: "income",
    category: "Education",
    date: "2026-10-18",
    notes: "Fictional sample income.",
    isDemo: true,
  },
];

export const DEMO_BUDGETS: Budget[] = CATEGORIES.map((category) => ({
  category,
  limit: DEFAULT_BUDGET_LIMITS[category],
  isDemo: true,
}));

export const DEMO_GOALS: SavingsGoal[] = [
  {
    id: "demo-goal-1",
    name: "Study materials fund",
    description: "Books, printing and course supplies for the next semester.",
    targetAmount: 3000,
    savedAmount: 900,
    targetDate: "2027-01-31",
    isDemo: true,
  },
  {
    id: "demo-goal-2",
    name: "Small emergency buffer",
    description: "A little cushion for unexpected travel or medical costs.",
    targetAmount: 8000,
    savedAmount: 2500,
    isDemo: true,
  },
];

export function createDemoData(): FinanceData {
  return {
    transactions: DEMO_TRANSACTIONS.map((transaction) => ({ ...transaction })),
    budgets: DEMO_BUDGETS.map((budget) => ({ ...budget })),
    goals: DEMO_GOALS.map((goal) => ({ ...goal })),
  };
}

export function roundAmount(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function sumExpenses(transactions: Transaction[]): number {
  return roundAmount(
    transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0),
  );
}

export function sumIncome(transactions: Transaction[]): number {
  return roundAmount(
    transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0),
  );
}

export function sumByCategory(
  transactions: Transaction[],
): Record<Category, number> {
  return CATEGORIES.reduce(
    (totals, category) => {
      totals[category] = roundAmount(
        transactions
          .filter(
            (transaction) =>
              transaction.type === "expense" &&
              transaction.category === category,
          )
          .reduce((total, transaction) => total + transaction.amount, 0),
      );
      return totals;
    },
    {} as Record<Category, number>,
  );
}

export function getBalanceRate(
  availableFunds: number,
  expenses: number,
): number | null {
  if (availableFunds <= 0) {
    return null;
  }

  return ((availableFunds - expenses) / availableFunds) * 100;
}

export function getFinanceSummary(
  transactions: Transaction[],
  startingAllowance: number = STARTING_ALLOWANCE,
): FinanceSummary {
  const income = sumIncome(transactions);
  const expenses = sumExpenses(transactions);
  const safeAllowance = Number.isFinite(startingAllowance)
    ? roundAmount(Math.max(startingAllowance, 0))
    : 0;
  const availableFunds = roundAmount(safeAllowance + income);
  const remaining = roundAmount(availableFunds - expenses);

  return {
    startingAllowance: safeAllowance,
    income,
    expenses,
    availableFunds,
    remaining,
    balanceRate: getBalanceRate(availableFunds, expenses),
  };
}

export function getTotalBudget(budgets: Budget[]): number {
  return roundAmount(
    budgets.reduce((total, budget) => total + budget.limit, 0),
  );
}

export function getBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
): BudgetProgress[] {
  const spending = sumByCategory(transactions);

  return budgets.map((budget) => {
    const spent = spending[budget.category] ?? 0;
    const limit = roundAmount(budget.limit);
    const remaining = roundAmount(limit - spent);
    const percentUsed =
      limit > 0 ? (spent / limit) * 100 : spent > 0 ? Infinity : 0;
    const over = spent > limit;
    const status: BudgetStatus = over
      ? "over"
      : percentUsed >= BUDGET_WARNING_PERCENT
        ? "near"
        : "safe";

    return {
      budget,
      category: budget.category,
      limit,
      spent,
      remaining,
      overBy: over ? roundAmount(spent - limit) : 0,
      percentUsed,
      status,
    };
  });
}

export function getGoalProgress(goal: SavingsGoal): GoalProgress {
  const targetAmount =
    Number.isFinite(goal.targetAmount) && goal.targetAmount > 0
      ? roundAmount(goal.targetAmount)
      : 0;
  const savedAmount =
    Number.isFinite(goal.savedAmount) && goal.savedAmount > 0
      ? roundAmount(goal.savedAmount)
      : 0;
  const remaining = roundAmount(Math.max(targetAmount - savedAmount, 0));
  const rawPercent = targetAmount > 0 ? (savedAmount / targetAmount) * 100 : 0;
  const isComplete = targetAmount > 0 && savedAmount >= targetAmount;

  return {
    goal,
    targetAmount,
    savedAmount,
    remaining,
    rawPercent,
    percentComplete: Math.min(Math.max(rawPercent, 0), 100),
    isComplete,
    overTargetBy: isComplete
      ? roundAmount(savedAmount - targetAmount)
      : 0,
  };
}

export function getGoalsSummary(goals: SavingsGoal[]): GoalsSummary {
  const progress = goals.map(getGoalProgress);
  const totalTarget = roundAmount(
    progress.reduce((total, item) => total + item.targetAmount, 0),
  );
  const totalSaved = roundAmount(
    progress.reduce((total, item) => total + item.savedAmount, 0),
  );
  const completedCount = progress.filter((item) => item.isComplete).length;
  const overallPercent =
    totalTarget > 0
      ? Math.min((totalSaved / totalTarget) * 100, 100)
      : null;

  return {
    totalTarget,
    totalSaved,
    totalRemaining: roundAmount(Math.max(totalTarget - totalSaved, 0)),
    completedCount,
    activeCount: goals.length - completedCount,
    overallPercent,
  };
}

export type TransactionDraft = {
  description: string;
  amount: string;
  type: TransactionType;
  category: Category;
  date: string;
  notes: string;
};

export type TransactionField =
  | "description"
  | "amount"
  | "type"
  | "category"
  | "date"
  | "notes";

export type TransactionErrors = Partial<Record<TransactionField, string>>;

export function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed || !/^(?:\d+|\d*\.\d+)$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  const rounded = roundAmount(parsed);

  if (!Number.isFinite(parsed) || parsed <= 0 || rounded <= 0) {
    return null;
  }

  return rounded;
}

export function parseNonNegativeAmount(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed || !/^(?:\d+|\d*\.\d+)$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return roundAmount(parsed);
}

export function parseOptionalAmount(value: string): number | null {
  return value.trim() ? parseNonNegativeAmount(value) : 0;
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function validateTransactionDraft(
  draft: TransactionDraft,
): TransactionErrors {
  const errors: TransactionErrors = {};
  const description = draft.description.trim();

  if (!description) {
    errors.description = "Enter a short description.";
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  const amount = parsePositiveAmount(draft.amount);

  if (amount === null) {
    errors.amount = "Enter an amount greater than zero.";
  } else if (amount > MAX_TRANSACTION_AMOUNT) {
    errors.amount = "Keep the amount at or under ₹1,00,00,000.";
  }

  if (draft.type !== "income" && draft.type !== "expense") {
    errors.type = "Choose income or expense.";
  }

  if (!CATEGORIES.includes(draft.category)) {
    errors.category = "Choose a valid category.";
  }

  if (!draft.date) {
    errors.date = "Choose a date for this entry.";
  } else if (!isValidISODate(draft.date)) {
    errors.date = "Enter a valid calendar date.";
  }

  if (draft.notes.trim().length > MAX_NOTES_LENGTH) {
    errors.notes = `Keep notes under ${MAX_NOTES_LENGTH} characters.`;
  }

  return errors;
}

export function validateBudgetLimit(value: string): string | null {
  const limit = parsePositiveAmount(value);

  if (limit === null) {
    return "Enter a monthly limit greater than zero.";
  }

  if (limit > MAX_BUDGET_LIMIT) {
    return "Keep the monthly limit at or under ₹1,00,00,000.";
  }

  return null;
}

export type GoalDraft = {
  name: string;
  description: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string;
};

export type GoalField =
  | "name"
  | "description"
  | "targetAmount"
  | "savedAmount"
  | "targetDate";

export type GoalErrors = Partial<Record<GoalField, string>>;

export function validateGoalDraft(draft: GoalDraft): GoalErrors {
  const errors: GoalErrors = {};
  const name = draft.name.trim();
  const description = draft.description.trim();
  const targetAmount = parsePositiveAmount(draft.targetAmount);
  const savedAmount = parseOptionalAmount(draft.savedAmount);

  if (!name) {
    errors.name = "Enter a name for this goal.";
  } else if (name.length > MAX_GOAL_NAME_LENGTH) {
    errors.name = `Keep the goal name under ${MAX_GOAL_NAME_LENGTH} characters.`;
  }

  if (description.length > MAX_GOAL_DESCRIPTION_LENGTH) {
    errors.description = `Keep the description under ${MAX_GOAL_DESCRIPTION_LENGTH} characters.`;
  }

  if (targetAmount === null) {
    errors.targetAmount = "Enter a target amount greater than zero.";
  } else if (targetAmount > MAX_GOAL_AMOUNT) {
    errors.targetAmount = "Keep the target at or under ₹1,00,00,000.";
  }

  if (savedAmount === null) {
    errors.savedAmount = "Enter zero or a positive saved amount.";
  } else if (savedAmount > MAX_GOAL_AMOUNT) {
    errors.savedAmount = "Keep the saved amount at or under ₹1,00,00,000.";
  }

  if (draft.targetDate && !isValidISODate(draft.targetDate)) {
    errors.targetDate = "Enter a valid target date or leave it blank.";
  }

  return errors;
}

export type GoalActivityMode = "contribute" | "withdraw";

export type GoalActivityDraft = {
  mode: GoalActivityMode;
  amount: string;
};

export type GoalActivityField = "mode" | "amount";
export type GoalActivityErrors = Partial<Record<GoalActivityField, string>>;

export function validateGoalActivityDraft(
  draft: GoalActivityDraft,
  goal: SavingsGoal,
): GoalActivityErrors {
  const errors: GoalActivityErrors = {};
  const amount = parsePositiveAmount(draft.amount);

  if (draft.mode !== "contribute" && draft.mode !== "withdraw") {
    errors.mode = "Choose whether to add or withdraw money.";
  }

  if (amount === null) {
    errors.amount = "Enter an amount greater than zero.";
  } else if (amount > MAX_GOAL_AMOUNT) {
    errors.amount = "Keep the amount at or under ₹1,00,00,000.";
  } else if (draft.mode === "withdraw" && amount > goal.savedAmount) {
    errors.amount = `You can withdraw up to ${formatINR(goal.savedAmount)}.`;
  }

  return errors;
}

export type AffordabilityDraft = {
  itemName: string;
  price: string;
  availableBalance: string;
  essentialExpenses: string;
  protectedSavings: string;
};

export type AffordabilityField =
  | "itemName"
  | "price"
  | "availableBalance"
  | "essentialExpenses"
  | "protectedSavings";

export type AffordabilityErrors = Partial<Record<AffordabilityField, string>>;

export function validateAffordabilityDraft(
  draft: AffordabilityDraft,
): AffordabilityErrors {
  const errors: AffordabilityErrors = {};
  const itemName = draft.itemName.trim();
  const price = parsePositiveAmount(draft.price);
  const availableBalance = parseNonNegativeAmount(draft.availableBalance);
  const essentialExpenses = parseOptionalAmount(draft.essentialExpenses);
  const protectedSavings = parseOptionalAmount(draft.protectedSavings);

  if (!itemName) {
    errors.itemName = "Enter the item or purchase name.";
  } else if (itemName.length > MAX_DESCRIPTION_LENGTH) {
    errors.itemName = `Keep the name under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  if (price === null) {
    errors.price = "Enter a purchase price greater than zero.";
  } else if (price > MAX_GOAL_AMOUNT) {
    errors.price = "Keep the purchase price at or under ₹1,00,00,000.";
  }

  if (availableBalance === null) {
    errors.availableBalance = "Enter an available balance of zero or more.";
  } else if (availableBalance > MAX_GOAL_AMOUNT) {
    errors.availableBalance = "Keep the available balance at or under ₹1,00,00,000.";
  }

  if (essentialExpenses === null) {
    errors.essentialExpenses = "Enter zero or a positive amount.";
  } else if (essentialExpenses > MAX_GOAL_AMOUNT) {
    errors.essentialExpenses = "Keep essential expenses at or under ₹1,00,00,000.";
  }

  if (protectedSavings === null) {
    errors.protectedSavings = "Enter zero or a positive amount.";
  } else if (protectedSavings > MAX_GOAL_AMOUNT) {
    errors.protectedSavings = "Keep protected savings at or under ₹1,00,00,000.";
  }

  return errors;
}

export type AffordabilityInput = {
  price: number;
  availableBalance: number;
  essentialExpenses: number;
  protectedSavings: number;
};

export type AffordabilityResult = {
  discretionary: number;
  fits: boolean;
  remainingAfterPurchase: number;
  shortfall: number;
};

export function calculateAffordability({
  price,
  availableBalance,
  essentialExpenses,
  protectedSavings,
}: AffordabilityInput): AffordabilityResult {
  const safeBalance = Number.isFinite(availableBalance)
    ? Math.max(availableBalance, 0)
    : 0;
  const safeEssentials = Number.isFinite(essentialExpenses)
    ? Math.max(essentialExpenses, 0)
    : 0;
  const safeProtected = Number.isFinite(protectedSavings)
    ? Math.max(protectedSavings, 0)
    : 0;
  const safePrice = Number.isFinite(price) ? Math.max(price, 0) : 0;
  const discretionary = roundAmount(
    safeBalance - safeEssentials - safeProtected,
  );
  const remainingAfterPurchase = roundAmount(discretionary - safePrice);
  const fits = safePrice > 0 && safePrice <= discretionary;

  return {
    discretionary,
    fits,
    remainingAfterPurchase,
    shortfall: fits
      ? 0
      : roundAmount(Math.max(safePrice - discretionary, 0)),
  };
}

export function formatINR(amount: number): string {
  const hasPaise = Math.round(Math.abs(amount) * 100) % 100 !== 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(amount);
}

export function formatTransactionDate(isoDate: string): string {
  if (!isValidISODate(isoDate)) {
    return isoDate;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function getTodayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function getMonthKey(isoDate: string): string {
  return isValidISODate(isoDate) ? isoDate.slice(0, 7) : "";
}

export function getAvailableMonthKeys(transactions: Transaction[]): string[] {
  return [...new Set(transactions.map((transaction) => getMonthKey(transaction.date)))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
}

export function formatMonthLabel(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;

  const [year, month] = monthKey.split("-").map(Number);
  if (month < 1 || month > 12) return monthKey;

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function getPreviousMonthKey(monthKey: string): string | null {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return null;

  const [year, month] = monthKey.split("-").map(Number);
  if (month < 1 || month > 12) return null;

  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function createTransactionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `txn-${crypto.randomUUID()}`;
  }

  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createGoalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `goal-${crypto.randomUUID()}`;
  }

  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
