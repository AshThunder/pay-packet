import type { LineSpec, PayrollFile, PeriodSpec } from "./types";
import { formatAmount, formatDate, formatMoney, formatMonth, formatMonthOnly, formatNumber, toMinor } from "./money";
import { fill, labelsFor } from "./strings";

export interface Line {
  code: string;
  label: string;
  /** This period, in minor units. */
  amount: number;
  /** Tax year to date, including this period. */
  ytd: number;
  /** How it was worked out ("37.5 h at £24.00"), or the line's note. */
  detail?: string;
}

export interface Slip {
  index: number;
  period: PeriodSpec;
  reference: string;
  url: string;
  earnings: Line[];
  deductions: Line[];
  employer: Line[];
  gross: number;
  totalDeductions: number;
  net: number;
  ytd: { gross: number; deductions: number; net: number; employer: number };
}

export interface Year {
  file: PayrollFile;
  slips: Slip[];
  /** Periods with no slip (unpaid), kept so the summary can say so. */
  unpaid: PeriodSpec[];
  totals: { gross: number; deductions: number; net: number; employer: number };
}

/** The standing lines, with a period's own lines replacing those of the same code and adding new ones. */
export function mergeLines(standing: LineSpec[], own: LineSpec[] = [], omit: string[] = []): LineSpec[] {
  const out = standing.filter((l) => !omit.includes(l.code)).map((l) => own.find((o) => o.code === l.code) ?? l);
  for (const l of own) if (!standing.some((s) => s.code === l.code)) out.push(l);
  return out;
}

/** The formatters every template uses, set to the file's locale and currency. */
export function formatter(file: PayrollFile) {
  const { locale, currency } = file.settings;
  const t = labelsFor(file.labels);
  return {
    t,
    fill,
    money: (minor: number) => formatMoney(minor, currency, locale),
    amount: (minor: number) => formatAmount(minor, currency, locale),
    date: (iso: string, style: "long" | "medium" | "short" = "medium") => formatDate(iso, locale, style),
    month: (iso: string) => formatMonth(iso, locale),
    monthShort: (iso: string) => formatMonthOnly(iso, locale),
    number: (n: number) => formatNumber(n, locale),
    /** "1–30 Nov 2026", in the locale's own way of writing a range. */
    range: (from: string, to: string) =>
      new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).formatRange(new Date(`${from}T00:00:00Z`), new Date(`${to}T00:00:00Z`)),
  };
}

export type Fmt = ReturnType<typeof formatter>;

function resolve(spec: LineSpec, file: PayrollFile, earnings: { code: string; amount: number }[], fmt: Fmt): { amount: number; detail?: string } {
  const { currency } = file.settings;
  if (spec.amount !== undefined) return { amount: toMinor(spec.amount, currency), detail: spec.note };
  if (spec.hours !== undefined && spec.rate !== undefined) {
    const amount = toMinor(spec.hours * spec.rate, currency);
    return { amount, detail: spec.note ?? fill(fmt.t.hoursAt, { hours: fmt.number(spec.hours), rate: fmt.money(toMinor(spec.rate, currency)) }) };
  }
  if (spec.percent !== undefined && spec.base !== undefined) {
    const codes = spec.base;
    const base = earnings.filter((e) => codes === "gross" || codes.includes(e.code)).reduce((s, e) => s + e.amount, 0);
    // percent of a minor-unit base, rounded half up once
    const amount = Math.round(Number(((base * spec.percent) / 100).toPrecision(12)));
    return { amount, detail: spec.note ?? fill(fmt.t.percentOf, { percent: fmt.number(spec.percent), base: fmt.money(base) }) };
  }
  throw new Error(`Line ${spec.code} has no amount, no hours and rate, and no percent and base`);
}

/** Every slip of the file's tax year, in order, with year-to-date figures carried through. */
export function buildYear(file: PayrollFile): Year {
  const fmt = formatter(file);
  const ytd = new Map<string, number>();
  const add = (code: string, v: number) => {
    const total = (ytd.get(code) ?? 0) + v;
    ytd.set(code, total);
    return total;
  };
  /** Lines seen earlier in the year, by kind: a line with year-to-date pay stays on later slips at zero. */
  const seen = { e: new Map<string, string>(), d: new Map<string, string>(), r: new Map<string, string>() };
  const carry = (lines: Line[], kind: "e" | "d" | "r") => {
    for (const l of lines) seen[kind].set(l.code, l.label);
    for (const [code, label] of seen[kind]) if (!lines.some((l) => l.code === code)) lines.push({ code, label, amount: 0, ytd: ytd.get(`${kind}:${code}`) ?? 0 });
    return lines;
  };
  const slips: Slip[] = [];
  const unpaid: PeriodSpec[] = [];
  const totals = { gross: 0, deductions: 0, net: 0, employer: 0 };

  for (const period of file.periods) {
    if (period.status === "unpaid") {
      unpaid.push(period);
      continue;
    }
    const omit = period.omit ?? [];
    const earningSpecs = mergeLines(file.pay.earnings, period.earnings, omit);
    const resolvedEarnings = earningSpecs.map((s) => ({ spec: s, ...resolve(s, file, [], fmt) }));
    const base = resolvedEarnings.map((e) => ({ code: e.spec.code, amount: e.amount }));
    const toLines = (specs: LineSpec[], kind: string) =>
      specs.map((s) => {
        const r = resolve(s, file, base, fmt);
        return { code: s.code, label: s.label, amount: r.amount, detail: r.detail, ytd: add(`${kind}:${s.code}`, r.amount) };
      });
    const earnings = carry(resolvedEarnings.map((e) => ({ code: e.spec.code, label: e.spec.label, amount: e.amount, detail: e.detail, ytd: add(`e:${e.spec.code}`, e.amount) })), "e");
    const deductions = carry(toLines(mergeLines(file.pay.deductions, period.deductions, omit), "d"), "d");
    const employer = carry(toLines(mergeLines(file.pay.employer ?? [], period.employer, omit), "r"), "r");
    const gross = earnings.reduce((s, l) => s + l.amount, 0);
    const totalDeductions = deductions.reduce((s, l) => s + l.amount, 0);
    const net = gross - totalDeductions;
    const employerTotal = employer.reduce((s, l) => s + l.amount, 0);
    totals.gross += gross;
    totals.deductions += totalDeductions;
    totals.net += net;
    totals.employer += employerTotal;
    const id = file.employee.id;
    const reference = `${id.startsWith(`${file.company.monogram}-`) ? id : `${file.company.monogram}-${id}`}-${period.id}`;
    slips.push({
      index: slips.length,
      period,
      reference,
      url: `${file.company.portalUrl.replace(/\/$/, "")}/${encodeURIComponent(file.employee.id)}/${encodeURIComponent(period.id)}`,
      earnings,
      deductions,
      employer,
      gross,
      totalDeductions,
      net,
      ytd: { ...totals },
    });
  }
  return { file, slips, unpaid, totals };
}

/** The latest slip: the one the email, page, PDF and card are made for by default. */
export function latestSlip(year: Year): Slip {
  const slip = year.slips.at(-1);
  if (!slip) throw new Error("The file has no paid period");
  return slip;
}

export function slipFor(year: Year, periodId: string): Slip {
  const slip = year.slips.find((s) => s.period.id === periodId);
  if (!slip) throw new Error(`No slip for period ${periodId}`);
  return slip;
}

/** Each line's total over the year, in the order lines first appear: what the annual summary lists. */
export function yearByLine(year: Year, kind: "earnings" | "deductions" | "employer"): { code: string; label: string; total: number; periods: number }[] {
  const out = new Map<string, { code: string; label: string; total: number; periods: number }>();
  for (const slip of year.slips)
    for (const l of slip[kind]) {
      if (l.amount === 0) continue;
      const row = out.get(l.code) ?? { code: l.code, label: l.label, total: 0, periods: 0 };
      row.total += l.amount;
      row.periods += 1;
      out.set(l.code, row);
    }
  return [...out.values()];
}
