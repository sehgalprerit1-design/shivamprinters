import { Phone } from "lucide-react";

export const SUPPORT_PHONE = "9910888217";
export const WHATSAPP_NUMBER = "919910888217"; // country code + number, no "+"

export function whatsappUrl(message = "Hi Shivam Printers, I have a question.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.93 9.93 0 1 0 12.04 2Zm0 18.12a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.22 8.22 0 1 1 6.85 3.73Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

/** "Chat on WhatsApp" link. Pass a message to pre-fill (e.g. the product name). */
export function WhatsAppLink({ message, className = "", label = "Chat on WhatsApp" }: { message?: string; className?: string; label?: string }) {
  return (
    <a href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm font-semibold text-[#128C7E] hover:text-[#075E54] ${className}`}>
      <WhatsAppIcon size={14} />{label}
    </a>
  );
}

/** "Questions? Call us · WhatsApp" line, used wherever a customer picks options or might hesitate. */
export function CallUs({ className = "", compact = false, whatsapp }: { className?: string; compact?: boolean; whatsapp?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <a href={`tel:+91${SUPPORT_PHONE}`} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-brand">
        <Phone size={compact ? 12 : 14} className="text-brand" />
        <span>Questions? Call us <b className="text-ink">{SUPPORT_PHONE}</b></span>
      </a>
      <span className="text-ink-3 text-xs">or</span>
      <WhatsAppLink message={whatsapp} label="WhatsApp us" />
    </span>
  );
}
