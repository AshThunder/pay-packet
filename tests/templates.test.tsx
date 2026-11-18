import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { render } from "@hyper-elements/react";
import { renderPdf } from "@hyper-elements/react/pdf";
import type { PayrollFile } from "../src/types";
import { buildYear, formatter, latestSlip } from "../src/payroll";
import { loadFonts } from "../src/fonts";
import { artefacts, gate, passed } from "../scripts/lib";

const load = (name: string) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf8")) as PayrollFile;

describe.each(["kestrel-freight", "thornbury-cycle-works", "brueckner-akustik"])("%s", (name) => {
  const file = load(name);
  const slip = latestSlip(buildYear(file));
  const fmt = formatter(file);
  const a = artefacts(file);
  const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

  it("passes the gate: no errors and no warnings in any artefact", async () => {
    const r = await gate(name, file);
    expect([...r.errors, ...r.warnings]).toEqual([]);
    expect(passed(r)).toBe(true);
  }, 30000);

  it("puts net pay in the email and its plain text, but not in the preview text", async () => {
    const { html, text } = await render(a.email, { plugins: [] });
    expect(plain(text)).toContain(plain(fmt.money(slip.net)));
    expect(html).toContain(slip.url.replace(/&/g, "&amp;"));
    const preview = a.email.props as { file: PayrollFile };
    expect(preview.file).toBe(file);
    const previewText = html.match(/<div[^>]*display:\s*none[^>]*>([^<]*)/i)?.[1] ?? "";
    expect(previewText.length).toBeGreaterThan(20);
    expect(previewText).not.toContain(fmt.amount(slip.net));
  });

  it("keeps amounts off the chat notice card, and on the archive card", async () => {
    const notice = await render(a.cardNotice);
    const archive = await render(a.cardArchive);
    expect(notice.text).not.toContain(fmt.amount(slip.net));
    expect(plain(archive.text)).toContain(plain(fmt.money(slip.net)));
  });

  it("draws the payslip as a one-page PDF", async () => {
    const { pdf } = await renderPdf(a.pdf, { fonts: await loadFonts() });
    const bytes = Buffer.from(pdf).toString("latin1");
    expect(bytes.startsWith("%PDF")).toBe(true);
    expect(bytes.match(/\/Type\s*\/Page[^s]/g)?.length).toBe(1);
  }, 30000);
});
