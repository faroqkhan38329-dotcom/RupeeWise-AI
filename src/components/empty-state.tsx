import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <section className="empty-state" aria-label={title}>
      <span className="empty-state-icon">
        <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="button button-secondary button-small">
          {actionLabel} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
