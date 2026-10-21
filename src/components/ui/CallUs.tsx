import { Phone } from "lucide-react";

export const SUPPORT_PHONE = "9910888217";

/** "Questions? Call us" line, used wherever a customer picks options or might hesitate. */
export function CallUs({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <a href={`tel:+91${SUPPORT_PHONE}`} className={`inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-brand ${className}`}>
      <Phone size={compact ? 12 : 14} className="text-brand" />
      <span>Questions? Call us <b className="text-ink">{SUPPORT_PHONE}</b></span>
    </a>
  );
}
