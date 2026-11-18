/**
 * npm run make: everything Pay Packet makes, for every file in data/ (or the files given), into
 * examples/<file>/. Nothing renders unless the gate passes.
 *
 *   email.html, email.txt     the pay-day email and its plain-text twin       (Email, render)
 *   page.html                 the web copy the email links to                 (Page, render)
 *   payslip.pdf               the A4 slip for the latest period               (Document, renderPdf)
 *   card-notice.png           the chat notice, no amounts                     (Canvas, renderImage)
 *   card-archive.png          the archive thumbnail, with figures             (Canvas, renderImage)
 *   annual-summary.pdf        the tax year on two pages                       (Document, renderPdf)
 *   year/payslip-<period>.pdf every slip of the year, from the same file      (Document, renderPdf)
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { formatDiagnostics, render } from "@hyper-elements/react";
import { renderPdf } from "@hyper-elements/react/pdf";
import { renderImage } from "@hyper-elements/react/image";
import { loadFonts } from "../src/fonts";
import { buildYear } from "../src/payroll";
import { artefacts, gate, loadData, passed, report, ROOT, sampleFiles } from "./lib";

const files = process.argv.slice(2).length ? process.argv.slice(2) : await sampleFiles();
const fonts = await loadFonts();
const timings: Record<string, unknown> = {};

const say = (label: string, diagnostics: { severity: string }[]) => {
  const loud = diagnostics.filter((d) => d.severity !== "info");
  if (loud.length) console.warn(`${label}:\n${formatDiagnostics(loud as never)}`);
};

for (const path of files) {
  const { slug, file } = await loadData(path);
  const result = await gate(slug, file);
  if (!passed(result)) {
    console.error(report(result));
    process.exitCode = 1;
    continue;
  }
  const out = join(ROOT, "examples", slug);
  await rm(join(out, "year"), { recursive: true, force: true });
  await mkdir(join(out, "year"), { recursive: true });
  const a = artefacts(file);

  const email = await render(a.email, { plugins: [] });
  await writeFile(join(out, "email.html"), email.html);
  await writeFile(join(out, "email.txt"), email.text);
  const page = await render(a.page);
  await writeFile(join(out, "page.html"), page.html);

  const pdf = await renderPdf(a.pdf, { fonts });
  say(`${slug} payslip.pdf`, pdf.diagnostics);
  await writeFile(join(out, "payslip.pdf"), pdf.pdf);
  for (const [name, el] of [["card-notice", a.cardNotice], ["card-archive", a.cardArchive]] as const) {
    const img = await renderImage(el, { fonts, scale: 1 });
    say(`${slug} ${name}.png`, img.diagnostics);
    await writeFile(join(out, `${name}.png`), img.image);
  }

  const started = performance.now();
  const annual = await renderPdf(a.annual, { fonts });
  await writeFile(join(out, "annual-summary.pdf"), annual.pdf);
  const year = buildYear(file);
  for (const slip of year.slips) {
    const one = await renderPdf(artefacts(file, slip.period.id).pdf, { fonts });
    say(`${slug} ${slip.period.id}`, one.diagnostics);
    await writeFile(join(out, "year", `payslip-${slip.period.id}.pdf`), one.pdf);
  }
  const ms = Math.round(performance.now() - started);
  timings[slug] = { slips: year.slips.length, unpaidPeriods: year.unpaid.length, yearBatchMs: ms };
  console.log(`${slug}: email, page, payslip, 2 cards, annual summary and ${year.slips.length} slips in examples/${slug}/ (year batch ${ms} ms)`);
}
await writeFile(join(ROOT, "examples/timings.json"), JSON.stringify({ note: "Measured on the machine that last ran npm run make; for scale, not a benchmark.", node: process.version, ...timings }, null, 2) + "\n");
