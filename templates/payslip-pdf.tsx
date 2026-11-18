/**
 * Pay Packet: the A4 payslip.
 *
 * The copy people print, file and send to a landlord or a bank. Laid out like a payroll bureau's
 * slip: letterhead and reference in the page header, the employee panel, earnings and deductions
 * with this period and the year to date, then net pay in a band of its own with the year's bars
 * beside it, and a footer that says who it is for. One page, always: long payrolls with many lines
 * shrink the type, never spill onto a second page.
 */
import { Column, Document, Heading, PageFooter, PageHeader, PageNumber, Row, Text, token } from "@hyper-elements/react";
import { context, type TemplateProps } from "../src/context";
import { Details, Figure, LABEL, Letterhead, PayTable } from "../src/parts";
import { YearBars } from "../src/chart";
import { INK, MONO, MUTED, RULE } from "../src/theme";

export const meta = {
  title: "Pay Packet A4 payslip",
  description: "A one-page A4 payslip: employee panel, earnings and deductions with year to date, net pay and the year's bars.",
  root: "Document",
};

/** A4 at 96 px to the inch is 794 wide; 44 px margins leave 706. */
const WIDTH = 706;

export default function PayslipPdf(props: TemplateProps) {
  const { file, year, slip, fmt, theme, monthName, accent, lang } = context(props);
  const { t, fill } = fmt;
  const c = file.company;
  const e = file.employee;
  const p = slip.period;
  const lineCount = slip.earnings.length + slip.deductions.length + slip.employer.length;
  const size = lineCount > 14 ? 9.5 : lineCount > 10 ? 10.5 : 11;
  return (
    <Document theme={theme} size="A4" margin={[36, 44, 36, 44]} lang={lang} title={`${fill(t.payslipFor, { period: monthName })} · ${e.name}`} style={{ gap: 20, fontSize: size }}>
      <PageHeader style={{ padding: [0, 0, 14], border: { bottom: `1px solid ${INK}` } }}>
        <Row style={{ alignItems: "center" }}>
          <Column>
            <Letterhead letters={c.monogram} accent={accent} name={c.legalName} sub={c.address.join(" · ")} size={36} />
          </Column>
          <Column style={{ width: 200, gap: 2 }}>
            <Text style={{ fontSize: 9, color: MUTED, textAlign: "right" }}>{c.payrollEmail}</Text>
            {c.registration ? <Text style={{ fontSize: 9, color: MUTED, textAlign: "right" }}>{`${c.registration.label} ${c.registration.value}`}</Text> : null}
          </Column>
        </Row>
      </PageHeader>

      <Row style={{ alignItems: "end", gap: 24, padding: [6, 0, 0] }}>
        <Column style={{ gap: 4 }}>
          <Text style={{ ...LABEL, fontSize: 9, color: accent }}>{`${t.payslip} · ${t.taxYear} ${file.settings.taxYear}`}</Text>
          <Heading level={1} style={{ fontSize: 30, letterSpacing: -0.8 }}>
            {monthName}
          </Heading>
        </Column>
        <Column style={{ width: 132 }}>
          <Figure label={t.period} value={fmt.range(p.start, p.end)} size={10} labelSize={8} />
        </Column>
        <Column style={{ width: 84 }}>
          <Figure label={t.payDate} value={fmt.date(p.payDate, "short")} size={10} labelSize={8} />
        </Column>
        <Column style={{ width: 132 }}>
          <Figure label={t.reference} value={slip.reference} size={10} labelSize={8} />
        </Column>
      </Row>

      <Column style={{ backgroundColor: token("colors.wash"), padding: [14, 16] }}>
        <Details
          columns={4}
          size={10.5}
          items={[
            { label: t.employee, value: e.name },
            { label: t.employeeNo, value: e.id, mono: true },
            { label: t.role, value: e.role },
            { label: t.department, value: e.department },
            { label: e.taxId.label, value: e.taxId.value, mono: true },
            ...(e.references ?? []).map((r) => ({ label: r.label, value: r.value })),
            { label: t.paymentTo, value: `${e.payment.bank} ${e.payment.account}` },
          ]}
        />
      </Column>

      <PayTable title={t.earnings} lines={slip.earnings} total={slip.gross} totalLabel={t.grossPay} fmt={fmt} size={size} col={104} />
      <PayTable title={t.deductions} lines={slip.deductions} total={slip.totalDeductions} totalLabel={t.totalDeductions} fmt={fmt} size={size} col={104} />

      <Row style={{ gap: 0, border: `1px solid ${INK}` }}>
        <Column style={{ width: 300, padding: [16, 18], gap: 8, backgroundColor: accent, color: "#FFFFFF" }}>
          <Text style={{ ...LABEL, fontSize: 9, color: "#FFFFFF" }}>{t.netPay}</Text>
          <Text style={{ fontFamily: MONO, fontWeight: 500, fontSize: 28, lineHeight: 1.05, letterSpacing: -0.8 }}>{fmt.money(slip.net)}</Text>
          <Text style={{ fontSize: 9.5, lineHeight: 1.4 }}>{`${fmt.money(slip.gross)} − ${fmt.money(slip.totalDeductions)}`}</Text>
        </Column>
        <Column style={{ padding: [14, 18], gap: 10 }}>
          <Row style={{ gap: 14 }}>
            <Figure label={`${t.grossPay} · ${t.yearToDate}`} value={fmt.money(slip.ytd.gross)} size={11} labelSize={8} />
            <Figure label={`${t.netPay} · ${t.yearToDate}`} value={fmt.money(slip.ytd.net)} size={11} labelSize={8} />
          </Row>
          <YearBars year={year} file={file} current={p.id} width={WIDTH - 300 - 36 - 2} height={40} accent={accent} />
        </Column>
      </Row>

      {slip.employer.length || p.balances?.length || p.message ? (
        <Row style={{ gap: 28 }}>
          {slip.employer.length ? (
            <Column style={{ width: 440, gap: 6 }}>
              <PayTable title={t.employerContributions} lines={slip.employer} total={slip.employer.reduce((s, l) => s + l.amount, 0)} totalLabel={t.totals} fmt={fmt} size={size - 1} col={100} detail={false} />
              <Text style={{ fontSize: 8.5, color: MUTED }}>{fill(t.employerNote, { company: c.name })}</Text>
            </Column>
          ) : null}
          <Column style={{ gap: 12 }}>
            {p.balances?.length ? (
              <Column style={{ gap: 6 }}>
                <Text style={{ ...LABEL, fontSize: 9, color: INK, padding: [0, 0, 6], border: { bottom: `1px solid ${INK}` } }}>{t.balances}</Text>
                {p.balances.map((b) => (
                  <Row key={b.label} style={{ gap: 8, padding: [0, 0, 5], border: { bottom: `1px solid ${RULE}` } }}>
                    <Text style={{ fontSize: size - 1 }}>{b.label}</Text>
                    <Text style={{ fontSize: size - 1, fontFamily: MONO, textAlign: "right" }}>{b.value}</Text>
                  </Row>
                ))}
              </Column>
            ) : null}
            {p.message ? <Text style={{ fontSize: 9.5, lineHeight: 1.45, padding: [8, 10], border: { left: `2px solid ${accent}` } }}>{p.message}</Text> : null}
          </Column>
        </Row>
      ) : null}

      <PageFooter style={{ padding: [10, 0, 0], border: { top: `1px solid ${RULE}` } }}>
        <Row>
          <Text style={{ fontSize: 8.5, color: MUTED }}>{`${fill(t.confidential, { name: e.name })} ${fill(t.questions, { email: c.payrollEmail })}`}</Text>
          <Column style={{ width: 90 }}>
            <Text style={{ fontSize: 8.5, color: MUTED, textAlign: "right" }}>
              {t.page} <PageNumber /> {t.of} <PageNumber total />
            </Text>
          </Column>
        </Row>
      </PageFooter>
    </Document>
  );
}
