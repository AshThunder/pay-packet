/**
 * The one data file. Everything Pay Packet renders (email, web copy, PDF payslip, card, year
 * summary) is read from a file of this shape: no figure is typed into a template.
 *
 * Amounts are in the currency's major unit (12500.5 is 12,500.50). They are turned into whole
 * minor units (cents, kobo, pence) once, in payroll.ts, so totals never drift by a rounding error.
 */
export interface PayrollFile {
  company: Company;
  settings: Settings;
  /** Overrides for any printed word: a German payroll prints German. See strings.ts for the keys. */
  labels?: Partial<Labels>;
  employee: Employee;
  /** The standing pay: what every period gets unless a period says otherwise. */
  pay: { earnings: LineSpec[]; deductions: LineSpec[]; employer?: LineSpec[] };
  /** One entry per pay period of the tax year, in order. */
  periods: PeriodSpec[];
}

export interface Company {
  name: string;
  /** Two or three letters for the monogram: no logo file is needed in any output. */
  monogram: string;
  legalName: string;
  address: string[];
  /** A registration line, labelled as the country labels it ("Company no.", "RC", "HRB"). */
  registration?: { label: string; value: string };
  payrollEmail: string;
  /** Where the employee opens their payslips. The period id and employee id are appended. */
  portalUrl: string;
  /** The brand's one accent colour. */
  accent: string;
}

export interface Settings {
  /** BCP 47 locale for dates and numbers: "en-GB", "en-NG", "de-DE". */
  locale: string;
  /** ISO 4217 currency code. */
  currency: string;
  /** How the tax year is named on the slip: "2025/26", "2026". */
  taxYear: string;
  frequency: "monthly" | "four-weekly" | "fortnightly" | "weekly";
}

export interface Employee {
  id: string;
  name: string;
  /** How the email greets them. */
  firstName: string;
  role: string;
  department: string;
  startDate: string;
  email: string;
  /** The tax reference as the country labels it ("NI number", "TIN", "Steuer-ID"). */
  taxId: { label: string; value: string };
  /** Extra reference lines (tax code, pension number, tax class). */
  references?: { label: string; value: string }[];
  payment: { method: string; bank: string; account: string };
}

/**
 * A pay line. Either a fixed `amount`, `hours` x `rate`, or `percent` of a `base`
 * (`"gross"`, or a list of earning codes).
 */
export interface LineSpec {
  code: string;
  label: string;
  amount?: number;
  hours?: number;
  rate?: number;
  percent?: number;
  base?: "gross" | string[];
  note?: string;
}

export interface PeriodSpec {
  /** "2026-11" for a month. */
  id: string;
  start: string;
  end: string;
  payDate: string;
  /** "paid" (the default) or "unpaid": an unpaid period (unpaid leave, a sabbatical month) has no slip. */
  status?: "paid" | "unpaid";
  /** Lines for this period: a code already in `pay` replaces that line, a new code is added. */
  earnings?: LineSpec[];
  deductions?: LineSpec[];
  employer?: LineSpec[];
  /** Standing lines left out this period, by code. */
  omit?: string[];
  /** Balances the slip shows (leave left, hours banked), already worked out by your HR system. */
  balances?: { label: string; value: string }[];
  /** A short note printed on this period's slip. */
  message?: string;
}

/** Every printed word. English by default; any of them can be given in the data file. */
export interface Labels {
  payslip: string;
  payslipFor: string;
  annualSummary: string;
  period: string;
  payDate: string;
  reference: string;
  employee: string;
  employeeNo: string;
  role: string;
  department: string;
  startDate: string;
  paymentTo: string;
  earnings: string;
  deductions: string;
  employerContributions: string;
  employerNote: string;
  thisPeriod: string;
  yearToDate: string;
  description: string;
  detail: string;
  grossPay: string;
  totalDeductions: string;
  netPay: string;
  balances: string;
  taxYear: string;
  greeting: string;
  readyLine: string;
  paidInto: string;
  openPayslip: string;
  downloadPdf: string;
  pdfAttached: string;
  questions: string;
  security: string;
  confidential: string;
  page: string;
  of: string;
  month: string;
  netByMonth: string;
  noSlip: string;
  slipReady: string;
  openInPortal: string;
  hoursAt: string;
  percentOf: string;
  gross: string;
  totals: string;
  periodsPaid: string;
  averageNet: string;
}
