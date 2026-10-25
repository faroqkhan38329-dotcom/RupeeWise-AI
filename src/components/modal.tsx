"use client";

import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";

type ModalProps = {
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  role?: "dialog" | "alertdialog";
  size?: "default" | "wide";
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

export function Modal({
  onClose,
  labelledBy,
  describedBy,
  role = "dialog",
  size = "default",
  initialFocusRef,
  children,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, onClose, initialFocusRef);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className={`modal-card${size === "wide" ? " modal-card-wide" : ""}`}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

type ModalHeaderProps = {
  titleId: string;
  title: string;
  description?: string;
  descriptionId?: string;
  onClose: () => void;
};

export function ModalHeader({
  titleId,
  title,
  description,
  descriptionId,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="modal-head">
      <div>
        <h3 id={titleId}>{title}</h3>
        {description && <p id={descriptionId}>{description}</p>}
      </div>
      <button
        type="button"
        className="drawer-close"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
