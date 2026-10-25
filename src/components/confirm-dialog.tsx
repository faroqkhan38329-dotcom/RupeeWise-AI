"use client";

import { useId, useRef } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal, ModalHeader } from "@/components/modal";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      onClose={onCancel}
      labelledBy={titleId}
      describedBy={descriptionId}
      role="alertdialog"
      initialFocusRef={cancelRef}
    >
      <ModalHeader
        titleId={titleId}
        title={title}
        onClose={onCancel}
        description="This action cannot be undone."
        descriptionId={`${titleId}-sub`}
      />
      <p className="confirm-message" id={descriptionId}>
        <AlertTriangle size={16} aria-hidden="true" />
        <span>{description}</span>
      </p>
      <div className="modal-actions">
        <button
          ref={cancelRef}
          type="button"
          className="button button-secondary button-small"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button button-danger button-small"
          onClick={onConfirm}
        >
          <Trash2 size={15} aria-hidden="true" />
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
