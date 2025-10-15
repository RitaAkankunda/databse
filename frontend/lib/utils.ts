import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a phone number for display. If it's already in +256 format we keep it.
 * For other inputs we try to show a cleaned version. This is a lightweight helper
 * for demo UI only.
 */
export function formatPhone(raw?: string | null) {
  if (!raw) return "-";
  const s = String(raw).trim();
  if (s.startsWith("+256")) return s;
  // remove non-digits and keep last 9 digits for mobile display
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 9) return `+256${digits.slice(-9)}`;
  return s;
}

/**
 * Format a NIN for display. Keep short for UI; show full string but allow masking if needed.
 */
export function formatNin(raw?: string | null, mask = false) {
  if (!raw) return "-";
  const s = String(raw).trim();
  if (!mask) return s;
  if (s.length <= 4) return s;
  return `${s.slice(0, 3)}...${s.slice(-2)}`;
}
