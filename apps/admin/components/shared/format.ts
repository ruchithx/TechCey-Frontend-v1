import { DEFAULT_LOCALE } from "@/core/config/constants";

/** Locale-aware date-time for tables/detail views. Returns "—" for null input. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Compact date only. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium" }).format(date);
}
