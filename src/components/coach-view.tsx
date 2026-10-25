"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  AlertTriangle,
  Bot,
  ClipboardList,
  Info,
  Loader2,
  PiggyBank,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Utensils,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  buildCoachContext,
  clampHistoryContent,
  COACH_MAX_HISTORY_MESSAGES,
  COACH_MAX_QUESTION_LENGTH,
  COACH_SUGGESTIONS,
  generateRuleReply,
} from "@/lib/coach";
import type {
  CoachFigure,
  CoachHistoryMessage,
  CoachReply,
  CoachSuggestion,
} from "@/lib/coach";
import { formatINR } from "@/lib/finance";
import { useFinanceStore } from "@/lib/finance-store";

const SUGGESTION_ICONS: Record<CoachSuggestion["id"], LucideIcon> = {
  allowance: Wallet,
  food: Utensils,
  savings: PiggyBank,
  budget: ClipboardList,
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  body: string;
  title?: string;
  source?: "rules" | "ai";
  figures?: CoachFigure[];
};

type RequestError = {
  message: string;
  question: string;
};

function historyForRequest(
  messages: ChatMessage[],
  question: string,
): CoachHistoryMessage[] {
  const history = [...messages];
  const last = history[history.length - 1];

  if (last?.role === "user" && last.body === question) {
    history.pop();
  }

  return history.slice(-COACH_MAX_HISTORY_MESSAGES).map((message) => ({
    role: message.role,
    content: clampHistoryContent(message.body),
  }));
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string" &&
      data.error.trim()
    ) {
      return data.error;
    }
  } catch {
    // The fallback below avoids showing raw HTML or provider output.
  }

  return "The coach could not complete that request. Nothing was saved. Please try again.";
}

function isCoachReply(value: unknown): value is CoachReply {
  if (typeof value !== "object" || value === null) return false;

  if (
    !("source" in value) ||
    (value.source !== "rules" && value.source !== "ai") ||
    !("body" in value) ||
    typeof value.body !== "string" ||
    !value.body.trim() ||
    !("title" in value) ||
    typeof value.title !== "string" ||
    !("figures" in value) ||
    !Array.isArray(value.figures)
  ) {
    return false;
  }

  return true;
}

export function CoachView({
  providerConfigured,
}: {
  providerConfigured: boolean;
}) {
  const { data, hydrated } = useFinanceStore();
  const formId = useId();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextIdRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [inputError, setInputError] = useState("");
  const [requestError, setRequestError] = useState<RequestError | null>(null);

  const context = useMemo(() => buildCoachContext(data), [data]);
  const demoCount = data.transactions.filter(
    (transaction) => transaction.isDemo,
  ).length;
  const budgetWarnings = context.budgets.filter(
    (budget) => budget.status === "near" || budget.status === "over",
  ).length;
  const topCategory = context.categories[0];
  const chatBusy = isSending || requestError !== null;

  useEffect(() => {
    const node = transcriptRef.current;

    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isSending, requestError]);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  function appendAssistant(reply: CoachReply) {
    nextIdRef.current += 1;

    setMessages((current) => [
      ...current,
      {
        id: nextIdRef.current,
        role: "assistant",
        body: reply.body,
        title: reply.title,
        source: reply.source,
        figures: reply.figures,
      },
    ]);
  }

  async function requestAnswer(question: string) {
    if (sendingRef.current) return;

    const controller = new AbortController();
    requestControllerRef.current = controller;
    sendingRef.current = true;
    setIsSending(true);
    setRequestError(null);

    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const history = historyForRequest(messages, question);
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, context }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (requestControllerRef.current !== controller) return;

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const payload: unknown = await response.json();

      if (!isCoachReply(payload)) {
        throw new Error(
          "The coach returned an unexpected response. Nothing was saved. Please try again.",
        );
      }

      appendAssistant(payload);
      inputRef.current?.focus();
    } catch (error) {
      if (requestControllerRef.current !== controller) return;

      const aborted = controller.signal.aborted;
      const message = aborted
        ? "The coach took too long to respond. Nothing was saved. Retry, or choose a rule-based answer."
        : error instanceof Error && error.message
          ? error.message
          : "The coach could not complete that request. Nothing was saved. Please try again.";

      setRequestError({ message, question });
    } finally {
      window.clearTimeout(timeoutId);

      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        sendingRef.current = false;
        setIsSending(false);
      }
    }
  }

  async function sendQuestion(rawQuestion: string) {
    if (sendingRef.current) return;

    const question = rawQuestion.trim();

    if (!question) {
      setInputError("Type a question before sending.");
      inputRef.current?.focus();
      return;
    }

    if (question.length > COACH_MAX_QUESTION_LENGTH) {
      setInputError(
        `Keep your question under ${COACH_MAX_QUESTION_LENGTH} characters.`,
      );
      inputRef.current?.focus();
      return;
    }

    setInputError("");
    setDraft("");
    nextIdRef.current += 1;
    setMessages((current) => [
      ...current,
      { id: nextIdRef.current, role: "user", body: question },
    ]);

    await requestAnswer(question);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(draft);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendQuestion(draft);
    }
  }

  function retryRequest() {
    if (!requestError) return;
    void requestAnswer(requestError.question);
  }

  function useRuleAnswer() {
    if (!requestError) return;

    const reply = generateRuleReply(requestError.question, context);
    appendAssistant(reply);
    setRequestError(null);
    setInputError("");
    inputRef.current?.focus();
  }

  function clearChat() {
    const controller = requestControllerRef.current;

    requestControllerRef.current = null;
    controller?.abort();
    sendingRef.current = false;
    setIsSending(false);
    setMessages([]);
    setDraft("");
    setInputError("");
    setRequestError(null);
    inputRef.current?.focus();
  }

  const dataLabel =
    data.transactions.length === 0
      ? "No transactions saved yet"
      : demoCount === data.transactions.length
        ? "Demo figures · fictional sample data"
        : demoCount > 0
          ? "Demo data + your entries"
          : "Your saved figures";

  if (!hydrated) {
    return (
      <div className="stage5-stack" aria-busy="true">
        <p className="sr-only" role="status">
          Loading your saved money summary…
        </p>
        <div className="skeleton stage5-banner-skeleton" />
        <div className="coach-layout">
          <div className="panel skeleton stage5-chat-skeleton" />
          <div className="stage5-side">
            <div className="panel skeleton stage5-side-skeleton" />
            <div className="panel skeleton stage5-side-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stage5-stack">
      <div className="stage5-topbar">
        <span className="demo-pill">
          <span className="demo-pill-dot" />
          {dataLabel}
        </span>
        <span
          className={`stage5-mode-chip ${
            providerConfigured
              ? "stage5-mode-chip-ai"
              : "stage5-mode-chip-rules"
          }`}
        >
          {providerConfigured ? (
            <Sparkles size={12} aria-hidden="true" />
          ) : (
            <ShieldCheck size={12} aria-hidden="true" />
          )}
          {providerConfigured ? "AI-assisted mode available" : "Rules only"}
        </span>
      </div>

      <section
        className={`stage5-mode-banner ${
          providerConfigured
            ? "stage5-mode-banner-ai"
            : "stage5-mode-banner-rules"
        }`}
        aria-label="How this coach works"
      >
        <span className="stage5-mode-icon" aria-hidden="true">
          {providerConfigured ? <Sparkles size={19} /> : <ShieldCheck size={19} />}
        </span>
        <div>
          <h3>
            {providerConfigured
              ? "AI-assisted answers are available"
              : "Rule-based coach active"}
          </h3>
          <p>
            {providerConfigured
              ? "Your question, recent chat messages and aggregate figures are sent to the configured AI provider. It never receives transaction descriptions, notes or goal names. Responses are labelled AI-assisted, and you can switch to a rule-based answer if the provider fails."
              : "No AI provider is configured, so answers come from transparent rules using your saved summaries. They are not generated by an AI model. Every figure is explained."}
          </p>
        </div>
      </section>

      <div className="coach-layout">
        <section className="panel coach-chat" aria-labelledby={`${formId}-title`}>
          <header className="coach-chat-head">
            <div className="coach-chat-identity">
              <span className="coach-chat-avatar" aria-hidden="true">
                <Bot size={19} />
              </span>
              <div>
                <h3 id={`${formId}-title`}>RupeeWise Money Coach</h3>
                <p>Educational guidance using this browser&apos;s saved summary</p>
              </div>
            </div>
            <button
              type="button"
              className="button button-secondary button-small coach-clear"
              onClick={clearChat}
              disabled={messages.length === 0 && !chatBusy}
            >
              <Trash2 size={14} aria-hidden="true" />
              Clear chat
            </button>
          </header>

          <div
            className="coach-transcript"
            ref={transcriptRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={isSending}
          >
            {messages.length === 0 && !isSending && !requestError ? (
              <div className="coach-empty">
                <span className="coach-empty-icon" aria-hidden="true">
                  <Bot size={27} strokeWidth={1.7} />
                </span>
                <h3>What would you like to work through?</h3>
                <p>
                  Start with a suggested question or ask your own. The coach sees
                  totals and category summaries, not your transaction notes.
                </p>
                <div className="coach-suggestion-grid">
                  {COACH_SUGGESTIONS.map((suggestion) => {
                    const Icon = SUGGESTION_ICONS[suggestion.id];

                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="coach-suggestion"
                        onClick={() => void sendQuestion(suggestion.question)}
                      >
                        <span className="coach-suggestion-icon" aria-hidden="true">
                          <Icon size={16} />
                        </span>
                        <span>
                          <strong>{suggestion.label}</strong>
                          <small>{suggestion.hint}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`coach-message coach-message-${message.role}`}
                  aria-label={
                    message.role === "user"
                      ? "Your message"
                      : "Coach response"
                  }
                >
                  {message.role === "assistant" && (
                    <span className="coach-message-avatar" aria-hidden="true">
                      <Bot size={15} />
                    </span>
                  )}

                  <div className="coach-message-content">
                    <div className="coach-message-meta">
                      <span>
                        {message.role === "user" ? "You" : "RupeeWise Coach"}
                      </span>
                      {message.role === "assistant" && message.source && (
                        <span
                          className={`coach-source-badge coach-source-${message.source}`}
                        >
                          {message.source === "ai" ? (
                            <Sparkles size={10} aria-hidden="true" />
                          ) : (
                            <ShieldCheck size={10} aria-hidden="true" />
                          )}
                          {message.source === "ai"
                            ? "AI-assisted"
                            : "Rule-based guide"}
                        </span>
                      )}
                    </div>

                    <div className="coach-bubble">
                      {message.title && message.role === "assistant" && (
                        <p className="coach-bubble-title">{message.title}</p>
                      )}
                      <p className="coach-bubble-body">{message.body}</p>

                      {message.role === "assistant" && message.source && (
                        <p className="coach-source-note">
                          {message.source === "ai"
                            ? "Generated by the configured AI provider. AI text can be wrong; check every figure below."
                            : "Generated by local rules, not an AI model. It uses only the figures below."}
                        </p>
                      )}

                      {message.role === "assistant" &&
                        message.figures &&
                        message.figures.length > 0 && (
                          <details className="coach-figures">
                            <summary>
                              Figures used in this answer (
                              {message.figures.length})
                            </summary>
                            <dl>
                              {message.figures.map((figure) => (
                                <div key={figure.label}>
                                  <dt>{figure.label}</dt>
                                  <dd>{figure.value}</dd>
                                  <p>{figure.explanation}</p>
                                </div>
                              ))}
                            </dl>
                          </details>
                        )}
                    </div>
                  </div>
                </article>
              ))
            )}

            {isSending && (
              <div className="coach-typing" role="status">
                <span className="coach-message-avatar" aria-hidden="true">
                  <Bot size={15} />
                </span>
                <div>
                  <p>
                    {providerConfigured
                      ? "Preparing an AI-assisted answer…"
                      : "Preparing a rule-based answer…"}
                  </p>
                  <span className="coach-typing-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
          </div>

          {requestError && (
            <div className="coach-request-error" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <div>
                <p>{requestError.message}</p>
                <div className="coach-error-actions">
                  <button
                    type="button"
                    className="button button-primary button-small"
                    onClick={retryRequest}
                    disabled={isSending}
                  >
                    <RotateCcw size={14} aria-hidden="true" />
                    Retry
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-small"
                    onClick={useRuleAnswer}
                    disabled={isSending}
                  >
                    <ShieldCheck size={14} aria-hidden="true" />
                    Use rule-based answer
                  </button>
                </div>
              </div>
            </div>
          )}

          <form className="coach-composer" onSubmit={handleSubmit} noValidate>
            <label htmlFor={`${formId}-question`}>Ask about your money</label>
            <textarea
              id={`${formId}-question`}
              ref={inputRef}
              className="form-input form-textarea coach-input"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (inputError) setInputError("");
              }}
              onKeyDown={handleInputKeyDown}
              maxLength={COACH_MAX_QUESTION_LENGTH}
              rows={3}
              placeholder="e.g. How can I make my allowance last the month?"
              aria-invalid={inputError ? true : undefined}
              aria-describedby={`${formId}-question-hint${
                inputError ? ` ${formId}-question-error` : ""
              }`}
              disabled={isSending}
            />

            <div className="coach-composer-foot">
              <p id={`${formId}-question-hint`} className="coach-input-hint">
                Enter sends · Shift + Enter adds a line ·{" "}
                {draft.length}/{COACH_MAX_QUESTION_LENGTH}
              </p>
              <button
                type="submit"
                className="button button-primary button-small coach-send"
                disabled={isSending || !draft.trim()}
              >
                {isSending ? (
                  <Loader2 size={15} className="spin" aria-hidden="true" />
                ) : (
                  <Send size={15} aria-hidden="true" />
                )}
                {isSending ? "Sending…" : "Send"}
              </button>
            </div>

            {inputError && (
              <p
                className="field-error coach-input-error"
                id={`${formId}-question-error`}
                role="alert"
              >
                {inputError}
              </p>
            )}

            <p className="coach-composer-privacy">
              <Info size={12} aria-hidden="true" />
              Chat history stays on this page and is not saved to browser
              storage. Never type OTPs, UPI PINs, passwords or card security
              codes.
            </p>
          </form>
        </section>

        <aside className="stage5-side" aria-label="Coach context">
          <section className="panel stage5-side-panel" aria-labelledby={`${formId}-snapshot`}>
            <div className="panel-heading">
              <div>
                <h3 id={`${formId}-snapshot`}>Snapshot used</h3>
                <p>Live totals from this browser. No bank connection.</p>
              </div>
              <Wallet
                size={18}
                aria-hidden="true"
                className="panel-heading-icon"
              />
            </div>

            <dl className="coach-snapshot">
              <div>
                <dt>Available funds</dt>
                <dd>{formatINR(context.availableFunds)}</dd>
                <p>Allowance + recorded income</p>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd className={context.remaining < 0 ? "text-negative" : ""}>
                  {formatINR(context.remaining)}
                </dd>
                <p>Available − recorded expenses</p>
              </div>
              <div>
                <dt>Recorded expenses</dt>
                <dd>{formatINR(context.recordedExpenses)}</dd>
                <p>
                  {context.transactionCount}{" "}
                  {context.transactionCount === 1 ? "entry" : "entries"} saved
                </p>
              </div>
              <div>
                <dt>Top category</dt>
                <dd>{topCategory ? topCategory.category : "—"}</dd>
                <p>
                  {topCategory
                    ? `${formatINR(topCategory.spent)} · ${topCategory.shareOfExpenses}%`
                    : "No expense entries yet"}
                </p>
              </div>
              <div>
                <dt>Budget alerts</dt>
                <dd>{budgetWarnings}</dd>
                <p>
                  {context.budgets.length}{" "}
                  {context.budgets.length === 1 ? "limit" : "limits"} saved
                </p>
              </div>
              <div>
                <dt>Goals remaining</dt>
                <dd>{formatINR(context.goals.totalRemaining)}</dd>
                <p>{context.goals.activeCount} active goals</p>
              </div>
            </dl>

            <p className="stage5-side-note">
              Each new question uses the latest saved figures. Goal savings are
              self-reported.
            </p>
          </section>

          <section className="panel stage5-side-panel" aria-labelledby={`${formId}-try`}>
            <div className="panel-heading">
              <div>
                <h3 id={`${formId}-try`}>Try asking</h3>
                <p>Suggested questions for a student budget.</p>
              </div>
            </div>

            <div className="coach-side-suggestions">
              {COACH_SUGGESTIONS.map((suggestion) => {
                const Icon = SUGGESTION_ICONS[suggestion.id];

                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="coach-side-suggestion"
                    onClick={() => void sendQuestion(suggestion.question)}
                    disabled={isSending}
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{suggestion.question}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel stage5-side-panel" aria-labelledby={`${formId}-privacy`}>
            <div className="panel-heading">
              <div>
                <h3 id={`${formId}-privacy`}>What gets shared</h3>
                <p>Privacy depends on whether a provider is configured.</p>
              </div>
            </div>

            <ul className="coach-privacy-list">
              <li>
                {providerConfigured
                  ? "Your question, recent chat messages and aggregate figures go to the configured AI provider."
                  : "Questions are handled by this app's server and answered by local rules. No external AI request is made."}
              </li>
              <li>
                Transaction descriptions, notes and goal names are never
                included in the coach context.
              </li>
              <li>
                Chat history is kept only in this page&apos;s memory and clears
                when you refresh or press Clear chat.
              </li>
              <li>
                No OTP, UPI PIN, password or card security code is needed here.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
