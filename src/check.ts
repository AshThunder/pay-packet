/**
 * Checks on the data file, run before anything is rendered: what Hyper Elements' validate() can't
 * know (a pay date before its period, a percentage of an earning that doesn't exist, a negative
 * net pay). Each problem names the path in the file to fix.
 */
import type { LineSpec, PayrollFile } from "./types";
import { buildYear } from "./payroll";

export interface Issue {
  path: string;
  message: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COLOR = /^#[0-9a-f]{6}$/i;

export function checkFile(file: PayrollFile): Issue[] {
  const issues: Issue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });
  const { settings, company, employee, pay, periods } = file;

  try {
    new Intl.NumberFormat(settings.locale, { style: "currency", currency: settings.currency });
    if (!Intl.supportedValuesOf("currency").includes(settings.currency)) add("settings.currency", `"${settings.currency}" is not an ISO 4217 currency code`);
  } catch {
    add("settings", `locale "${settings.locale}" or currency "${settings.currency}" is not valid`);
  }
  if (!COLOR.test(company.accent)) add("company.accent", `"${company.accent}" is not a #rrggbb colour`);
  if (!/^[A-Z0-9]{1,3}$/.test(company.monogram)) add("company.monogram", "one to three capital letters or digits");
  if (!/^https:\/\//.test(company.portalUrl)) add("company.portalUrl", "must be an https URL");
  for (const [key, value] of Object.entries({ "employee.name": employee.name, "employee.id": employee.id, "employee.firstName": employee.firstName, "employee.payment.account": employee.payment.account }))
    if (!value?.trim()) add(key, "is empty");
  if (/\d{5,}/.test(employee.payment.account)) add("employee.payment.account", "shows more than four digits: mask the account number");

  const earningCodes = new Set(pay.earnings.map((l) => l.code));
  periods.forEach((p) => p.earnings?.forEach((l) => earningCodes.add(l.code)));

  const checkLines = (lines: LineSpec[] | undefined, path: string, isEarning: boolean) => {
    const seen = new Set<string>();
    lines?.forEach((l, i) => {
      const at = `${path}[${i}]`;
      if (seen.has(l.code)) add(at, `code "${l.code}" appears twice`);
      seen.add(l.code);
      const ways = [l.amount !== undefined, l.hours !== undefined || l.rate !== undefined, l.percent !== undefined || l.base !== undefined].filter(Boolean).length;
      if (ways !== 1) add(at, "give exactly one of: amount; hours and rate; percent and base");
      if (l.hours !== undefined && l.rate === undefined) add(at, "hours without a rate");
      if (l.percent !== undefined && l.base === undefined) add(at, "percent without a base");
      if (isEarning && l.percent !== undefined) add(at, "an earning can't be a percentage of earnings");
      if (Array.isArray(l.base)) for (const code of l.base) if (!earningCodes.has(code)) add(`${at}.base`, `no earning has code "${code}"`);
      if ((l.amount ?? 0) < 0 || (l.percent ?? 0) < 0 || (l.hours ?? 0) < 0) add(at, "amounts, hours and percentages can't be negative");
    });
  };
  checkLines(pay.earnings, "pay.earnings", true);
  checkLines(pay.deductions, "pay.deductions", false);
  checkLines(pay.employer, "pay.employer", false);

  const ids = new Set<string>();
  periods.forEach((p, i) => {
    const at = `periods[${i}]`;
    if (ids.has(p.id)) add(`${at}.id`, `period "${p.id}" appears twice`);
    ids.add(p.id);
    for (const k of ["start", "end", "payDate"] as const) if (!ISO_DATE.test(p[k])) add(`${at}.${k}`, `"${p[k]}" is not a YYYY-MM-DD date`);
    if (p.end < p.start) add(`${at}.end`, "ends before it starts");
    if (p.payDate < p.start) add(`${at}.payDate`, "pay date is before the period starts");
    const prev = periods[i - 1];
    if (prev && p.start <= prev.end) add(`${at}.start`, `overlaps ${prev.id}`);
    checkLines(p.earnings, `${at}.earnings`, true);
    checkLines(p.deductions, `${at}.deductions`, false);
    checkLines(p.employer, `${at}.employer`, false);
  });
  if (periods.length === 0) add("periods", "has no periods");

  if (issues.length === 0) {
    const year = buildYear(file);
    for (const s of year.slips) if (s.net < 0) add(`periods[${file.periods.indexOf(s.period)}]`, `net pay is negative (${s.net} minor units): deductions exceed gross pay`);
    if (year.slips.length === 0) add("periods", "every period is unpaid: there is no slip to render");
  }
  return issues;
}
