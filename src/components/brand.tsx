import Link from "next/link";
import { Wallet } from "lucide-react";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link
      href="/"
      className="brand"
      aria-label="RupeeWise AI home — Every rupee has a purpose"
    >
      <span className="brand-mark" aria-hidden="true">
        <Wallet size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="brand-copy">
          <span className="brand-name">RupeeWise AI</span>
          <span className="brand-tagline">Every rupee has a purpose.</span>
        </span>
      )}
    </Link>
  );
}
