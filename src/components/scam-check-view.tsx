"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Info,
  KeyRound,
  Loader2,
  MessageSquareText,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  analyzeScamMessage,
  SCAM_DEMO_MESSAGES,
  SCAM_MAX_MESSAGE_LENGTH,
  SCAM_RULE_SUMMARIES,
} from "@/lib/scam-rules";
import type {
  ScamAnalysis,
  ScamDemoMessage,
  ScamFinding,
  ScamRiskLevel,
} from "@/lib/scam-rules";

type AiStatus = "idle" | "loading" | "done" | "error";

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
    // Use a safe generic message instead of raw response content.
  }

  return "The optional AI analysis could not be completed. The rule-based results above are still available.";
}

function riskContent(risk: ScamRiskLevel): {
  icon: typeof ShieldAlert;
  label: string;
  title: string;
  description: string;
} {
  if (risk === "high") {
    return {
      icon: ShieldAlert,
      label: "High-risk warning signs",
      title: "High-risk warning signs found",
      description:
        "Treat this message as dangerous. Do not share secrets, open links, install anything, contact the sender or send money.",
    };
  }

  if (risk === "caution") {
    return {
      icon: AlertTriangle,
      label: "Some warning signs",
      title: "Some warning signs found",
      description:
        "Pause and verify independently before doing anything the message asks. These rules cannot confirm who sent it.",
    };
  }

  return {
    icon: ScanSearch,
    label: "No rule matches",
    title: "No rule matches found",
    description:
      "This is not a safety guarantee. Scams can avoid these rules, so verify anything unexpected through an official channel.",
  };
}

function severityLabel(finding: ScamFinding): string {
  return finding.severity === "critical" ? "Critical sign" : "Caution sign";
}

export function ScamCheckView({
  providerConfigured,
}: {
  providerConfigured: boolean;
}) {
  const formId = useId();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const aiControllerRef = useRef<AbortController | null>(null);
  const lastAiMessageRef = useRef<string | null>(null);

  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<ScamAnalysis | null>(null);
  const [inputError, setInputError] = useState("");
  const [demoNote, setDemoNote] = useState("");
  const [aiConsent, setAiConsent] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiBody, setAiBody] = useState("");
  const [aiError, setAiError] = useState("");

  const aiLoading = aiStatus === "loading";

  useEffect(() => {
    return () => {
      aiControllerRef.current?.abort();
    };
  }, []);

  function resetAi() {
    aiControllerRef.current?.abort();
    aiControllerRef.current = null;
    lastAiMessageRef.current = null;
    setAiStatus("idle");
    setAiBody("");
    setAiError("");
  }

  function updateMessage(value: string) {
    setMessage(value);
    setDemoNote("");

    if (inputError) setInputError("");
    if (analysis) setAnalysis(null);
    if (aiStatus !== "idle" || aiBody || aiError) resetAi();
  }

  async function requestAi(candidate: string) {
    aiControllerRef.current?.abort();
    const controller = new AbortController();
    aiControllerRef.current = controller;
    lastAiMessageRef.current = candidate;

    setAiStatus("loading");
    setAiBody("");
    setAiError("");

    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch("/api/scam-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: candidate, consent: true }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (aiControllerRef.current !== controller) return;

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const payload: unknown = await response.json();

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("body" in payload) ||
        typeof payload.body !== "string" ||
        !payload.body.trim()
      ) {
        throw new Error(
          "The optional AI analysis returned an unexpected response. The rule-based results above are unchanged.",
        );
      }

      setAiBody(payload.body);
      setAiStatus("done");
    } catch (error) {
      if (aiControllerRef.current !== controller) return;

      const aborted = controller.signal.aborted;
      setAiError(
        aborted
          ? "The optional AI analysis took too long. The rule-based results above are unchanged."
          : error instanceof Error && error.message
            ? error.message
            : "The optional AI analysis could not be completed. The rule-based results above are unchanged.",
      );
      setAiStatus("error");
    } finally {
      window.clearTimeout(timeoutId);

      if (aiControllerRef.current === controller) {
        aiControllerRef.current = null;
      }
    }
  }

  function runAnalysis() {
    const candidate = message.trim();

    if (!candidate) {
      setInputError("Paste a message before checking it.");
      setAnalysis(null);
      messageRef.current?.focus();
      return;
    }

    if (message.length > SCAM_MAX_MESSAGE_LENGTH) {
      setInputError(
        `Keep the message under ${SCAM_MAX_MESSAGE_LENGTH} characters.`,
      );
      setAnalysis(null);
      messageRef.current?.focus();
      return;
    }

    setInputError("");
    const nextAnalysis = analyzeScamMessage(candidate);
    setAnalysis(nextAnalysis);

    if (aiConsent && providerConfigured) {
      void requestAi(candidate);
    } else {
      resetAi();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (aiLoading) return;
    runAnalysis();
  }

  function handleMessageKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (!aiLoading) runAnalysis();
    }
  }

  function loadDemo(demo: ScamDemoMessage) {
    if (aiLoading) return;

    resetAi();
    setAiConsent(false);
    setMessage(demo.text);
    setAnalysis(null);
    setInputError("");
    setDemoNote(`Loaded the fictional “${demo.label}” demo. Select Check warning signs.`);
    messageRef.current?.focus();
  }

  function clearAll() {
    resetAi();
    setMessage("");
    setAnalysis(null);
    setInputError("");
    setDemoNote("");
    setAiConsent(false);
    messageRef.current?.focus();
  }

  function retryAi() {
    const candidate = lastAiMessageRef.current;
    if (!candidate) return;
    void requestAi(candidate);
  }

  const risk = analysis ? riskContent(analysis.riskLevel) : null;
  const RiskIcon = risk?.icon;

  return (
    <div className="stage5-stack">
      <section
        className="stage5-mode-banner stage5-mode-banner-scam"
        aria-label="Scam Check demo mode"
      >
        <span className="stage5-mode-icon" aria-hidden="true">
          <ShieldCheck size={19} />
        </span>
        <div>
          <h3>Demo analysis · transparent rules</h3>
          <p>
            The default checker runs nine local warning-sign rules in your
            browser. Results are indicative and cannot prove a message is safe
            or fraudulent. Any optional AI second opinion is clearly labelled
            and only sent after you give explicit consent.
          </p>
        </div>
        <span className="stage5-scam-badge">
          <ScanSearch size={12} aria-hidden="true" />
          Rules only {providerConfigured ? "+ optional AI" : ""}
        </span>
      </section>

      <div className="scam-layout">
        <section className="panel scam-checker" aria-labelledby={`${formId}-title`}>
          <div className="panel-heading">
            <div>
              <h3 id={`${formId}-title`}>Inspect a suspicious message</h3>
              <p>
                Paste an SMS, email or payment request. Nothing is stored or
                logged by this app.
              </p>
            </div>
            <MessageSquareText
              size={18}
              aria-hidden="true"
              className="panel-heading-icon"
            />
          </div>

          <div className="scam-secret-warning">
            <KeyRound size={16} aria-hidden="true" />
            <p>
              <strong>Never paste live authentication secrets.</strong> Do not
              include OTPs, UPI PINs, ATM PINs, passwords or card security
              codes. If you already pasted one here, clear this page and do not
              share it with anyone.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field scam-message-field">
              <div className="scam-label-row">
                <label htmlFor={`${formId}-message`}>
                  Suspicious message text
                </label>
                <span className="scam-char-count">
                  {message.length}/{SCAM_MAX_MESSAGE_LENGTH}
                </span>
              </div>
              <textarea
                id={`${formId}-message`}
                ref={messageRef}
                className="form-input form-textarea scam-textarea"
                value={message}
                onChange={(event) => updateMessage(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                maxLength={SCAM_MAX_MESSAGE_LENGTH}
                rows={9}
                placeholder="Paste the message here. Remove any OTP, PIN, password or card details first."
                aria-invalid={inputError ? true : undefined}
                aria-describedby={`${formId}-message-hint${
                  inputError ? ` ${formId}-message-error` : ""
                }`}
                disabled={aiLoading}
              />

              {inputError && (
                <p
                  className="field-error scam-input-error"
                  id={`${formId}-message-error`}
                  role="alert"
                >
                  {inputError}
                </p>
              )}

              <p className="field-hint" id={`${formId}-message-hint`}>
                Up to {SCAM_MAX_MESSAGE_LENGTH.toLocaleString("en-IN")}{" "}
                characters. Ctrl/Cmd + Enter also checks the message.
              </p>
            </div>

            {providerConfigured ? (
              <label className="scam-ai-consent" htmlFor={`${formId}-ai-consent`}>
                <input
                  id={`${formId}-ai-consent`}
                  type="checkbox"
                  checked={aiConsent}
                  onChange={(event) => {
                    setAiConsent(event.target.checked);
                    if (!event.target.checked) resetAi();
                  }}
                  disabled={aiLoading}
                />
                <span>
                  <strong>
                    <Sparkles size={13} aria-hidden="true" />
                    Also request optional AI-assisted analysis
                  </strong>
                  <small>
                    If selected, the pasted message is sent to this app&apos;s
                    server and then to the configured external AI provider.
                    The provider&apos;s privacy and retention terms apply. The
                    app does not store the message. The rule-based result still
                    appears first and remains the primary analysis.
                  </small>
                </span>
              </label>
            ) : (
              <p className="scam-ai-unavailable">
                <Info size={14} aria-hidden="true" />
                AI-assisted analysis is unavailable because no provider is
                configured. The demo rules work locally without sending this
                message anywhere.
              </p>
            )}

            {demoNote && (
              <p className="inline-feedback inline-feedback-info" role="status">
                <Info size={14} aria-hidden="true" />
                <span>{demoNote}</span>
              </p>
            )}

            <div className="scam-actions">
              <button
                type="submit"
                className="button button-primary button-small"
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <Loader2 size={15} className="spin" aria-hidden="true" />
                ) : (
                  <ScanSearch size={15} aria-hidden="true" />
                )}
                {aiLoading ? "Checking message…" : "Check warning signs"}
              </button>
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={clearAll}
                disabled={!message && !analysis && !demoNote && !aiLoading}
              >
                <Trash2 size={14} aria-hidden="true" />
                Clear
              </button>
            </div>
          </form>

          <div className="scam-demo">
            <div className="scam-demo-head">
              <span>
                <MessageSquareText size={15} aria-hidden="true" />
                <strong>Demo messages</strong>
              </span>
              <small>Fictional examples · nothing is sent</small>
            </div>
            <div className="scam-demo-buttons">
              {SCAM_DEMO_MESSAGES.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  className="scam-demo-button"
                  onClick={() => loadDemo(demo)}
                  disabled={aiLoading}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          className="panel scam-results"
          aria-labelledby={`${formId}-results-title`}
          aria-busy={aiLoading}
        >
          <div className="panel-heading">
            <div>
              <h3 id={`${formId}-results-title`}>Warning-sign results</h3>
              <p>Demo rules run locally before any optional AI analysis.</p>
            </div>
            <span className="scam-result-source">Rule-based</span>
          </div>

          {!analysis ? (
            <div className="scam-results-empty">
              <span className="coach-empty-icon" aria-hidden="true">
                <ShieldAlert size={26} strokeWidth={1.7} />
              </span>
              <h4>No message checked yet</h4>
              <p>
                Paste a message or load a fictional demo. The checker lists
                matching warning signs and practical next steps.
              </p>
              <p className="scam-results-empty-note">
                It never opens links, runs attachments, contacts the sender or
                starts a payment.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`scam-summary scam-risk-${analysis.riskLevel}`}
                role="status"
                aria-live="polite"
              >
                {RiskIcon && <RiskIcon size={20} aria-hidden="true" />}
                <div>
                  <p className="scam-summary-kicker">
                    {risk?.label} · {analysis.findings.length}{" "}
                    {analysis.findings.length === 1 ? "finding" : "findings"}
                  </p>
                  <h4>{risk?.title}</h4>
                  <p>{risk?.description}</p>
                </div>
              </div>

              {analysis.findings.length > 0 && (
                <ul className="scam-finding-list">
                  {analysis.findings.map((finding) => (
                    <li
                      key={finding.id}
                      className={`scam-finding scam-finding-${finding.severity}`}
                    >
                      <span className="scam-finding-icon" aria-hidden="true">
                        {finding.severity === "critical" ? (
                          <ShieldAlert size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                      </span>
                      <div>
                        <div className="scam-finding-head">
                          <h4>{finding.title}</h4>
                          <span
                            className={`scam-severity scam-severity-${finding.severity}`}
                          >
                            {severityLabel(finding)}
                          </span>
                        </div>
                        <p className="scam-finding-noticed">
                          {finding.noticed}
                        </p>
                        <p className="scam-finding-why">
                          <strong>Why it matters:</strong>{" "}
                          {finding.whyItMatters}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <section
                className="scam-next-steps"
                aria-labelledby={`${formId}-next-steps`}
              >
                <h4 id={`${formId}-next-steps`}>What to do next</h4>
                <ol>
                  {analysis.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>

              <p className="scam-disclaimer">
                <Info size={14} aria-hidden="true" />
                <span>
                  <strong>Indicative only.</strong> Rule-based checks can miss
                  scams and can flag legitimate messages. No result proves a
                  message is safe or fraudulent.
                </span>
              </p>
            </>
          )}

          {aiStatus === "loading" && (
            <div className="scam-ai-panel scam-ai-loading" role="status">
              <span className="scam-ai-panel-head">
                <BrainCircuit size={16} aria-hidden="true" />
                <strong>Optional AI-assisted analysis</strong>
                <span className="scam-ai-badge">AI · external</span>
              </span>
              <p>
                Asking the configured AI provider for a second perspective.
                The rule-based result above is unchanged.
              </p>
              <span className="scam-ai-loading-row" aria-hidden="true">
                <Loader2 size={15} className="spin" />
                <span className="coach-typing-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </span>
            </div>
          )}

          {aiStatus === "done" && aiBody && (
            <div className="scam-ai-panel">
              <span className="scam-ai-panel-head">
                <Sparkles size={16} aria-hidden="true" />
                <strong>Additional AI-assisted analysis</strong>
                <span className="scam-ai-badge">AI · external</span>
              </span>
              <p className="scam-ai-body">{aiBody}</p>
              <p className="scam-ai-note">
                <Info size={12} aria-hidden="true" />
                This supplementary text was generated by the configured AI
                provider. It may be wrong and does not replace the rule-based
                findings above.
              </p>
            </div>
          )}

          {aiStatus === "error" && (
            <div className="scam-ai-panel scam-ai-error" role="alert">
              <span className="scam-ai-panel-head">
                <AlertTriangle size={16} aria-hidden="true" />
                <strong>Optional AI analysis failed</strong>
              </span>
              <p>{aiError}</p>
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={retryAi}
                disabled={aiLoading}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Retry AI analysis
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="panel scam-rules-panel" aria-labelledby={`${formId}-rules`}>
        <div className="panel-heading">
          <div>
            <h3 id={`${formId}-rules`}>Transparent demo rules</h3>
            <p>
              These checks run locally. A match is a warning sign, not proof of
              fraud, and a missing match is not proof of safety.
            </p>
          </div>
          <span className="scam-result-source">
            <CheckCircle2 size={12} aria-hidden="true" />
            {SCAM_RULE_SUMMARIES.length} checks
          </span>
        </div>

        <ul className="scam-rule-grid">
          {SCAM_RULE_SUMMARIES.map((rule) => (
            <li key={rule.id}>
              <h4>{rule.label}</h4>
              <p>{rule.description}</p>
            </li>
          ))}
        </ul>

        <p className="scam-rules-footnote">
          No links are opened, no attachments are executed, no sender is
          contacted and no payment is started. This educational prototype is
          not professional financial, legal or security advice.
        </p>
      </section>
    </div>
  );
}
