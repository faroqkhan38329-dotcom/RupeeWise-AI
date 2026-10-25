"use client";

import { useId, useState } from "react";
import { RotateCcw, ShieldCheck, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { resetFinanceData, useFinanceStore } from "@/lib/finance-store";

export function DataNotice() {
  const titleId = useId();
  const { storage, notice, persistenceError } = useFinanceStore();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  return (
    <>
      <section className="storage-notice" aria-labelledby={titleId}>
        <span className="storage-notice-icon">
          <ShieldCheck size={17} aria-hidden="true" />
        </span>
        <div className="storage-notice-body">
          <h3 id={titleId}>Saved in this browser only</h3>
          <p>
            Fictional sample entries and goals are marked{" "}
            <span className="data-badge">Sample</span>. Entries you add are kept
            in this browser&apos;s local storage and are <strong>not encrypted</strong>.
            Anyone using this browser profile may be able to read them. Nothing
            is sent to a server.
          </p>
          <p className="storage-privacy">
            No bank or payment connections. RupeeWise AI never asks for UPI
            PINs, OTPs, card numbers or banking passwords.
          </p>

          {storage === "unavailable" && (
            <p className="storage-warning" role="alert">
              Browser storage is unavailable here, so changes will be lost when
              you refresh.
            </p>
          )}

          {notice && !noticeDismissed && (
            <p className="storage-warning" role="status">
              <span>{notice}</span>
              <button
                type="button"
                className="notice-dismiss"
                onClick={() => setNoticeDismissed(true)}
                aria-label="Dismiss storage notice"
              >
                <X size={13} aria-hidden="true" />
              </button>
            </p>
          )}

          {persistenceError && (
            <p className="storage-warning storage-warning-error" role="alert">
              {persistenceError}
            </p>
          )}

          {resetMessage && (
            <p className="storage-success" role="status">
              {resetMessage}
            </p>
          )}

          <div className="storage-actions">
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => setConfirmingReset(true)}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Restore demo data
            </button>
            <span>
              Browser storage is not encrypted financial storage.
            </span>
          </div>
        </div>
      </section>

      {confirmingReset && (
        <ConfirmDialog
          title="Restore demo data?"
          description="This replaces every transaction, budget and savings goal saved in this browser with the fictional demo dataset. Your current entries cannot be recovered."
          confirmLabel="Restore demo"
          onCancel={() => setConfirmingReset(false)}
          onConfirm={() => {
            resetFinanceData();
            setConfirmingReset(false);
            setNoticeDismissed(true);
            setResetMessage("Demo dataset restored in this browser.");
          }}
        />
      )}
    </>
  );
}
