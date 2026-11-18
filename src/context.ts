import type { PayrollFile } from "./types";
import { buildYear, formatter, latestSlip, slipFor } from "./payroll";
import { themeFor } from "./theme";
import sample from "../data/kestrel-freight.json";

/** The sample every template renders with no props: Kestrel Freight, November 2026. */
export const SAMPLE = sample as PayrollFile;

export interface TemplateProps {
  /** The payroll file. Defaults to the Kestrel Freight sample. */
  file?: PayrollFile;
  /** The period to render ("2026-11"). Defaults to the latest paid period. */
  period?: string;
}

/** Everything a template needs from one file: the year worked out, the slip, the formatters and the theme. */
export function context({ file = SAMPLE, period }: TemplateProps) {
  const year = buildYear(file);
  const slip = period ? slipFor(year, period) : latestSlip(year);
  const fmt = formatter(file);
  const monthName = fmt.month(slip.period.start);
  return { file, year, slip, fmt, theme: themeFor(file), monthName, accent: file.company.accent, lang: file.settings.locale };
}
