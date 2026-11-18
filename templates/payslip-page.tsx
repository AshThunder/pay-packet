/**
 * Pay Packet: the payslip's web copy.
 *
 * What the email's button opens: the whole slip on one responsive page, read mostly on phones.
 * Net pay sits on the brand's accent at the top; below it every earning, deduction and employer
 * contribution with this period and the year to date side by side, then balances and the
 * period's note. On a phone the panels stack and the type steps down.
 */
import { Button, Column, Heading, Row, Section, Text, Page, Grid, token } from "@hyper-elements/react";
import { context, type TemplateProps } from "../src/context";
import { Details, Figure, LABEL, Letterhead, PayTable } from "../src/parts";
import { MONO, MUTED } from "../src/theme";

export const meta = {
  title: "Pay Packet payslip page",
  description: "The full payslip as a responsive web page: net pay first, every line with its year to date.",
  root: "Page",
};

/** Inter and IBM Plex Mono from the Fontsource CDN; the stacks fall back to system fonts. */
const FONTS = [
  { family: "Inter", src: "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2", format: "woff2", weight: "100 900" },
  { family: "Inter", src: "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-ext-wght-normal.woff2", format: "woff2", weight: "100 900" },
  { family: "IBM Plex Mono", src: "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.woff2", format: "woff2", weight: 400 },
  { family: "IBM Plex Mono", src: "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-500-normal.woff2", format: "woff2", weight: 500 },
] as const;

export default function PayslipPage(props: TemplateProps & { pdfHref?: string }) {
  const { file, slip, fmt, theme, monthName, accent, lang } = context(props);
  const { t, fill } = fmt;
  const c = file.company;
  const e = file.employee;
  const p = slip.period;
  const pdfHref = props.pdfHref ?? "payslip.pdf";
  /** The three tables, once at desktop sizes and once for phones (a cell's width can't change on a phone, so the phone gets its own narrower columns). */
  const tables = (size: number, col: number, detail: boolean) => (
    <>
          <PayTable title={t.earnings} lines={slip.earnings} total={slip.gross} totalLabel={t.grossPay} fmt={fmt} size={size} col={col} detail={detail} />
          <PayTable title={t.deductions} lines={slip.deductions} total={slip.totalDeductions} totalLabel={t.totalDeductions} fmt={fmt} size={size} col={col} detail={detail} />
          {slip.employer.length ? (
            <Column style={{ gap: 12 }}>
              <PayTable title={t.employerContributions} lines={slip.employer} total={slip.employer.reduce((s, l) => s + l.amount, 0)} totalLabel={t.totals} fmt={fmt} size={size} col={col} detail={detail} />
              <Text style={{ fontSize: Math.min(size, 14), color: MUTED }}>{fill(t.employerNote, { company: c.name })}</Text>
            </Column>
          ) : null}
    </>
  );
  return (
    <Page theme={theme} width={1040} lang={lang} title={`${fill(t.payslipFor, { period: monthName })} · ${c.name}`} description={fill(t.confidential, { name: e.name })} fonts={[...FONTS]} style={{ gap: 0 }}>
      <Section style={{ backgroundColor: token("colors.card"), padding: [20, 32], border: { bottom: { width: 1, style: "solid", color: token("colors.border") } }, mobile: { padding: [16, 16] } }}>
        <Row style={{ alignItems: "center", gap: 16 }} stackOnMobile={false}>
          <Column>
            <Letterhead letters={c.monogram} accent={accent} name={c.name} sub={`${t.payslip} · ${t.taxYear} ${file.settings.taxYear}`} />
          </Column>
          <Column style={{ width: 220, alignItems: "end" }} hidden={{ mobile: true }}>
            <Button href={pdfHref} style={{ padding: [10, 18], fontSize: 14 }}>
              {t.downloadPdf}
            </Button>
          </Column>
        </Row>
      </Section>

      <Section style={{ padding: [48, 32, 24], gap: 28, mobile: { padding: [28, 16, 16], gap: 20 } }}>
        <Column style={{ gap: 8 }}>
          <Text style={{ ...LABEL, mobile: { fontSize: 12 } }}>
            {fmt.range(p.start, p.end)}
          </Text>
          <Heading level={1} style={{ fontSize: 44, letterSpacing: -1.2, mobile: { fontSize: 30, letterSpacing: -0.6 } }}>
            {fill(t.payslipFor, { period: monthName })}
          </Heading>
          <Text style={{ fontFamily: MONO, fontSize: 14, color: MUTED }}>
            {t.reference} {slip.reference}
          </Text>
        </Column>

        <Row style={{ gap: 24, alignItems: "stretch" }}>
          <Column style={{ width: 400, padding: 32, gap: 20, backgroundColor: accent, color: "#FFFFFF", justifyContent: "space-between", mobile: { padding: 24 } }}>
            <Column style={{ gap: 10 }}>
              <Text style={{ ...LABEL, color: "#FFFFFF" }}>{t.netPay}</Text>
              <Text style={{ fontFamily: MONO, fontWeight: 500, fontSize: 46, lineHeight: 1.05, letterSpacing: -1.5, mobile: { fontSize: 36 } }}>{fmt.money(slip.net)}</Text>
            </Column>
            <Text style={{ fontSize: 15, lineHeight: 1.5 }}>
              {fill(t.paidInto, { amount: fmt.money(slip.net), bank: e.payment.bank, account: e.payment.account, date: fmt.date(p.payDate, "long") })}
            </Text>
          </Column>
          <Column style={{ apply: ["card"], gap: 24, mobile: { padding: 20 } }}>
            <Details
              columns={2}
              size={15}
              stack={false}
              items={[
                { label: t.employee, value: e.name },
                { label: t.employeeNo, value: e.id, mono: true },
                { label: t.role, value: e.role },
                { label: t.department, value: e.department },
                { label: e.taxId.label, value: e.taxId.value, mono: true },
                ...(e.references ?? []).map((r) => ({ label: r.label, value: r.value })),
              ]}
            />
          </Column>
        </Row>

        <Grid columns={4} style={{ gap: 16 }}>
          {[
            [t.grossPay, fmt.money(slip.gross)],
            [t.totalDeductions, fmt.money(slip.totalDeductions)],
            [`${t.grossPay}, ${t.yearToDate.toLowerCase()}`, fmt.money(slip.ytd.gross)],
            [`${t.netPay}, ${t.yearToDate.toLowerCase()}`, fmt.money(slip.ytd.net)],
          ].map(([label, value]) => (
            <Column key={label} style={{ padding: [18, 20], border: { top: `2px solid ${"#17191E"}` }, backgroundColor: token("colors.card") }}>
              <Figure label={label} value={value} size={20} />
            </Column>
          ))}
        </Grid>
      </Section>

      <Section style={{ padding: [0, 32, 24], mobile: { padding: [0, 16, 16] } }}>
        <Column style={{ apply: ["card"], gap: 40, padding: [32, 32, 36], mobile: { padding: 20, gap: 28 } }}>
          <Column hidden={{ mobile: true }} style={{ gap: 40 }}>
            {tables(15, 150, true)}
          </Column>
          <Column hidden={{ desktop: true }} style={{ gap: 28 }}>
            {tables(13, 96, false)}
          </Column>
        </Column>
      </Section>

      <Section style={{ padding: [0, 32, 48], mobile: { padding: [0, 16, 32] } }}>
        <Row style={{ gap: 24 }}>
          {p.balances?.length ? (
            <Column style={{ apply: ["card"], gap: 12, padding: 24, mobile: { padding: 20 } }}>
              <Heading level={2} style={{ ...LABEL, fontSize: 12 }}>{t.balances}</Heading>
              {p.balances.map((b) => (
                <Row key={b.label} style={{ gap: 12 }} stackOnMobile={false}>
                  <Column>
                    <Text style={{ fontSize: 15 }}>{b.label}</Text>
                  </Column>
                  <Column style={{ width: 160 }}>
                    <Text style={{ fontSize: 15, fontFamily: MONO, textAlign: "right" }}>{b.value}</Text>
                  </Column>
                </Row>
              ))}
            </Column>
          ) : null}
          <Column style={{ gap: 10, padding: [4, 0] }}>
            {p.message ? <Text style={{ fontSize: 15 }}>{p.message}</Text> : null}
            <Text style={{ fontSize: 14, color: MUTED }}>{fill(t.questions, { email: c.payrollEmail })}</Text>
            <Text style={{ fontSize: 14, color: MUTED }}>
              {c.legalName}, {c.address.join(", ")}
              {c.registration ? `. ${c.registration.label} ${c.registration.value}` : ""}
            </Text>
          </Column>
        </Row>
        <Column hidden={{ desktop: true }} style={{ padding: [16, 0, 0] }}>
          <Button href={pdfHref} style={{ width: "100%" }}>
            {t.downloadPdf}
          </Button>
        </Column>
      </Section>
    </Page>
  );
}
