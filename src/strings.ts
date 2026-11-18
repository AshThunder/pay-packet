import type { Labels } from "./types";

/** English defaults. Placeholders in braces are filled by `fill()`. */
export const ENGLISH: Labels = {
  payslip: "Payslip",
  payslipFor: "Payslip for {period}",
  annualSummary: "Annual pay summary",
  period: "Pay period",
  payDate: "Pay date",
  reference: "Reference",
  employee: "Employee",
  employeeNo: "Employee no.",
  role: "Role",
  department: "Department",
  startDate: "Start date",
  paymentTo: "Paid to",
  earnings: "Earnings",
  deductions: "Deductions",
  employerContributions: "Employer contributions",
  employerNote: "Paid by {company} on top of your pay. Not taken from it.",
  thisPeriod: "This period",
  yearToDate: "Year to date",
  description: "Description",
  detail: "Detail",
  grossPay: "Gross pay",
  totalDeductions: "Total deductions",
  netPay: "Net pay",
  balances: "Balances",
  taxYear: "Tax year",
  greeting: "Hi {name},",
  readyLine: "Your payslip for {period} is ready.",
  paidInto: "{amount} will be paid into your {bank} account {account} on {date}.",
  openPayslip: "Open your payslip",
  downloadPdf: "Download PDF",
  pdfAttached: "A PDF copy is attached to this email for your records.",
  questions: "Questions about this payslip? Reply to this email or write to {email}.",
  security: "{company} will never ask for your password or bank details by email.",
  confidential: "Private and confidential. Prepared for {name}.",
  page: "Page",
  of: "of",
  month: "Period",
  netByMonth: "Net pay and deductions by period",
  noSlip: "No pay this period",
  slipReady: "Your payslip is ready",
  openInPortal: "Open it in the {company} payroll portal",
  hoursAt: "{hours} h at {rate}",
  percentOf: "{percent}% of {base}",
  gross: "Gross",
  totals: "Totals",
  periodsPaid: "Periods paid",
  averageNet: "Average net pay",
};

export function labelsFor(overrides: Partial<Labels> = {}): Labels {
  return { ...ENGLISH, ...overrides };
}

/** "{name}" in a label, filled from `values`. A placeholder with no value is left as it is, so it shows in review. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all);
}
