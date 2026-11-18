import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { PayrollFile } from "../src/types";
import { buildYear, latestSlip, mergeLines, yearByLine } from "../src/payroll";
import { formatMoney, minorDigits, roundHalfUp, toMinor } from "../src/money";
import { checkFile } from "../src/check";

const load = (name: string) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), "utf8")) as PayrollFile;
const SAMPLES = ["kestrel-freight", "thornbury-cycle-works", "brueckner-akustik"];

describe("money", () => {
  it("rounds half up after removing float noise", () => {
    expect(toMinor(1.005, "GBP")).toBe(101);
    expect(toMinor(2.675, "EUR")).toBe(268);
    expect(roundHalfUp(-2.5)).toBe(-3);
  });
  it("uses each currency's own minor unit", () => {
    expect(minorDigits("JPY")).toBe(0);
    expect(minorDigits("KWD")).toBe(3);
    expect(toMinor(1234, "JPY")).toBe(1234);
  });
  it("formats by locale", () => {
    expect(formatMoney(435338, "EUR", "de-DE")).toBe("4.353,38\u00a0€");
    expect(formatMoney(57180000, "NGN", "en-NG")).toBe("₦571,800.00");
    expect(formatMoney(279784, "GBP", "en-GB")).toBe("£2,797.84");
  });
});

describe("mergeLines", () => {
  const standing = [{ code: "A", label: "A", amount: 1 }, { code: "B", label: "B", amount: 2 }];
  it("replaces by code, adds new codes and omits", () => {
    const out = mergeLines(standing, [{ code: "B", label: "B2", amount: 5 }, { code: "C", label: "C", amount: 3 }], ["A"]);
    expect(out.map((l) => `${l.code}:${l.amount}`)).toEqual(["B:5", "C:3"]);
  });
});

describe.each(SAMPLES)("%s", (name) => {
  const file = load(name);
  const year = buildYear(file);
  it("passes the data checks", () => expect(checkFile(file)).toEqual([]));
  it("nets every slip to gross minus deductions", () => {
    for (const s of year.slips) {
      expect(s.gross).toBe(s.earnings.reduce((a, l) => a + l.amount, 0));
      expect(s.net).toBe(s.gross - s.totalDeductions);
      expect(s.net).toBeGreaterThan(0);
    }
  });
  it("carries year to date forward and ends on the year's totals", () => {
    let gross = 0;
    for (const s of year.slips) {
      gross += s.gross;
      expect(s.ytd.gross).toBe(gross);
      expect(s.earnings.reduce((a, l) => a + l.ytd, 0)).toBe(s.ytd.gross);
      expect(s.deductions.reduce((a, l) => a + l.ytd, 0)).toBe(s.ytd.deductions);
    }
    expect(latestSlip(year).ytd).toEqual(year.totals);
    expect(yearByLine(year, "earnings").reduce((a, l) => a + l.total, 0)).toBe(year.totals.gross);
  });
  it("gives every slip a unique reference", () => {
    expect(new Set(year.slips.map((s) => s.reference)).size).toBe(year.slips.length);
  });
});

describe("rules", () => {
  it("works percentages out on the named earnings, in minor units", () => {
    const s = latestSlip(buildYear(load("kestrel-freight")));
    expect(s.deductions.find((l) => l.code === "PEN")?.amount).toBe(5760000); // 8% of 720,000.00
    expect(s.deductions.find((l) => l.code === "NHF")?.amount).toBe(1125000); // 2.5% of 450,000.00
  });
  it("keeps a line paid earlier in the year on later slips, at zero", () => {
    const nov = latestSlip(buildYear(load("brueckner-akustik")));
    const ug = nov.earnings.find((l) => l.code === "UG");
    expect(ug).toMatchObject({ amount: 0, ytd: 120000 });
  });
  it("renders the full UK tax year: twelve slips", () => {
    expect(buildYear(load("thornbury-cycle-works")).slips).toHaveLength(12);
  });
  it("skips an unpaid period: no slip, year to date unchanged", () => {
    const file = load("thornbury-cycle-works");
    file.periods[5] = { ...file.periods[5], status: "unpaid" };
    const year = buildYear(file);
    expect(year.slips).toHaveLength(11);
    expect(year.unpaid.map((p) => p.id)).toEqual(["2025-09"]);
    expect(year.slips[5].ytd.gross).toBe(year.slips[4].ytd.gross + year.slips[5].gross);
  });
});

describe("checkFile", () => {
  it("names each problem's path", () => {
    const file = load("kestrel-freight");
    file.pay.deductions[2] = { code: "NHF", label: "NHF", percent: 2.5, base: ["BASE"] };
    file.periods[3] = { ...file.periods[3], start: "2026-03-15" };
    file.employee.payment.account = "0123456789";
    const paths = checkFile(file).map((i) => i.path);
    expect(paths).toContain("pay.deductions[2].base");
    expect(paths).toContain("periods[3].start");
    expect(paths).toContain("employee.payment.account");
  });
  it("refuses a slip whose deductions exceed its pay", () => {
    const file = load("kestrel-freight");
    file.periods[0] = { ...file.periods[0], deductions: [{ code: "LOAN", label: "Loan repayment", amount: 900000 }] };
    expect(checkFile(file).some((i) => i.message.includes("net pay is negative"))).toBe(true);
  });
});
