/** Money as whole minor units, formatted by the file's locale and currency. */

export function minorDigits(currency: string): number {
  return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/** A major-unit amount from the data file as whole minor units. */
export function toMinor(amount: number, currency: string): number {
  return roundHalfUp(amount * 10 ** minorDigits(currency));
}

/** Rounds half away from zero, as payroll does, after taking out float noise (1.005 * 100 = 100.49999...). */
export function roundHalfUp(value: number): number {
  const clean = Number(value.toPrecision(12));
  return Math.sign(clean) * Math.round(Math.abs(clean));
}

export function formatMoney(minor: number, currency: string, locale: string): string {
  const digits = minorDigits(currency);
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}

/** The figure alone, without the currency sign: for table columns headed by the currency. */
export function formatAmount(minor: number, currency: string, locale: string): string {
  const digits = minorDigits(currency);
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
}

export function formatNumber(value: number, locale: string, digits = 2): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
}

/** Dates in the file are calendar dates ("2026-11-28"): formatted in UTC so no time zone moves them a day. */
export function formatDate(iso: string, locale: string, style: "long" | "medium" | "short" = "medium"): string {
  const opts: Intl.DateTimeFormatOptions =
    style === "long" ? { day: "numeric", month: "long", year: "numeric" } : style === "medium" ? { day: "numeric", month: "short", year: "numeric" } : { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatMonth(iso: string, locale: string, style: "long" | "short" = "long"): string {
  return new Intl.DateTimeFormat(locale, { month: style, year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function formatMonthOnly(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}
