import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ReactElement } from "react";
import { validate, type Diagnostic } from "@hyper-elements/react";
import { emailClients } from "@hyper-elements/email-clients";
import { lint } from "@hyper-elements/lint";
import type { PayrollFile } from "../src/types";
import { checkFile } from "../src/check";
import { buildYear } from "../src/payroll";
import PayslipEmail from "../templates/payslip-email";
import PayslipPage from "../templates/payslip-page";
import PayslipPdf from "../templates/payslip-pdf";
import PayslipCard from "../templates/payslip-card";
import AnnualSummary from "../templates/annual-summary";

export const ROOT = new URL("..", import.meta.url).pathname;

export async function loadData(path: string): Promise<{ slug: string; file: PayrollFile }> {
  return { slug: basename(path, ".json"), file: JSON.parse(await readFile(path, "utf8")) };
}

export async function sampleFiles(): Promise<string[]> {
  const dir = join(ROOT, "data");
  return (await readdir(dir)).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

/** Every artefact one data file makes, as elements: what the gate checks and what make renders. */
export function artefacts(file: PayrollFile, period?: string) {
  const props = { file, period };
  return {
    email: <PayslipEmail {...props} />,
    page: <PayslipPage {...props} pdfHref="payslip.pdf" />,
    pdf: <PayslipPdf {...props} />,
    cardNotice: <PayslipCard {...props} variant="notice" />,
    cardArchive: <PayslipCard {...props} variant="archive" />,
    annual: <AnnualSummary file={file} />,
  } satisfies Record<string, ReactElement>;
}

export interface GateResult {
  slug: string;
  dataIssues: { path: string; message: string }[];
  checked: number;
  errors: Diagnostic[];
  warnings: Diagnostic[];
  notes: Record<string, number>;
}

let plugins: { email: unknown[]; page: unknown[] } | undefined;

/**
 * The gate: the data checks, then validate() on every artefact (email with the email-client
 * models and lint, page with lint), for the latest period and every slip of the year. Errors and
 * warnings fail it; notes (things a client draws a little differently) are counted.
 */
export async function gate(slug: string, file: PayrollFile): Promise<GateResult> {
  plugins ??= { email: [await emailClients(), lint({ kind: "transactional" })], page: [lint()] };
  const result: GateResult = { slug, dataIssues: checkFile(file), checked: 0, errors: [], warnings: [], notes: {} };
  if (result.dataIssues.length) return result;
  const run = (el: ReactElement, kind: "email" | "page" | "other", where: string) => {
    const v = validate(el, { plugins: (kind === "other" ? [] : plugins![kind]) as never });
    result.checked++;
    for (const d of v.diagnostics) {
      const tagged = { ...d, path: `${where}: ${d.path ?? ""}` };
      if (d.severity === "error") result.errors.push(tagged);
      else if (d.severity === "warning") result.warnings.push(tagged);
      else result.notes[d.code] = (result.notes[d.code] ?? 0) + 1;
    }
  };
  const latest = artefacts(file);
  run(latest.email, "email", "email");
  run(latest.page, "page", "page");
  run(latest.cardNotice, "other", "card-notice");
  run(latest.cardArchive, "other", "card-archive");
  run(latest.annual, "other", "annual-summary");
  for (const slip of buildYear(file).slips) run(artefacts(file, slip.period.id).pdf, "other", `payslip-${slip.period.id}`);
  return result;
}

export function passed(r: GateResult) {
  return r.dataIssues.length === 0 && r.errors.length === 0 && r.warnings.length === 0;
}

export function report(r: GateResult) {
  const lines = [`${r.slug}: ${passed(r) ? "pass" : "FAIL"} (${r.checked} artefacts, ${r.errors.length} errors, ${r.warnings.length} warnings, ${Object.values(r.notes).reduce((a, b) => a + b, 0)} notes)`];
  for (const i of r.dataIssues) lines.push(`  data  ${i.path}: ${i.message}`);
  for (const d of [...r.errors, ...r.warnings]) lines.push(`  ${d.severity} ${d.code} at ${d.path}: ${d.message}`);
  return lines.join("\n");
}
