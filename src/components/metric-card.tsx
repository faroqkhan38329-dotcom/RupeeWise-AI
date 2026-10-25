import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  negative?: boolean;
  positive?: boolean;
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  negative = false,
  positive = false,
}: MetricCardProps) {
  const tone = negative
    ? " metric-value-negative"
    : positive
      ? " metric-value-positive"
      : "";

  return (
    <article className="panel metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <p className={`metric-value${tone}`}>{value}</p>
      <p className="metric-hint">{hint}</p>
    </article>
  );
}
