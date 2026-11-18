/**
 * Pay Packet: the payslip email.
 *
 * The message an employee gets on pay day. It answers the three questions people open a payslip
 * email for (how much, when, into which account) above the fold, then lists this period's
 * earnings and deductions and links to the full slip. The preview text names the month and pay
 * date but never the amount, so a phone's lock screen does not show anyone's pay.
 *
 * Email-safe by construction: no Svg, no images (the monogram is a box of text), every Row's
 * columns sized for classic Outlook, and a plain-text twin from the same render.
 */
import { Button, Column, Divider, Email, Heading, Row, Section, Text, token } from "@hyper-elements/react";
import { context, type TemplateProps } from "../src/context";
import { Figure, Letterhead, PayTable } from "../src/parts";
import { MONO, MUTED } from "../src/theme";

export const meta = {
  title: "Pay Packet payslip email",
  description: "A pay-day email: net pay, pay date and account first, this period's lines, and a link to the full slip.",
  root: "Email",
};

export default function PayslipEmail(props: TemplateProps) {
  const { file, slip, fmt, theme, monthName, accent, lang } = context(props);
  const { t, fill } = fmt;
  const c = file.company;
  const e = file.employee;
  return (
    <Email
      theme={theme}
      width={600}
      lang={lang}
      title={fill(t.payslipFor, { period: monthName })}
      previewText={`${fill(t.readyLine, { period: monthName })} ${t.payDate}: ${fmt.date(slip.period.payDate, "long")}.`}
      style={{ gap: 0 }}
    >
      <Section style={{ padding: [32, 24, 20], mobile: { padding: [24, 16, 16] } }}>
        <Row style={{ alignItems: "center" }}>
          <Column style={{ width: 380 }}>
            <Letterhead letters={c.monogram} accent={accent} name={c.name} sub={t.payslip} />
          </Column>
          <Column style={{ width: 172 }} hidden={{ mobile: true }}>
            <Text style={{ textAlign: "right", fontFamily: MONO, fontSize: 13, color: MUTED }}>{slip.reference}</Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ padding: [0, 24], mobile: { padding: [0, 12] } }}>
        <Column style={{ apply: ["card"], gap: 28, mobile: { padding: 20 } }}>
          <Column style={{ gap: 10 }}>
            <Text style={{ fontSize: 15 }}>{fill(t.greeting, { name: e.firstName })}</Text>
            <Heading level={1} style={{ fontSize: 28, mobile: { fontSize: 24 } }}>
              {fill(t.readyLine, { period: monthName })}
            </Heading>
          </Column>

          <Column style={{ gap: 14, padding: [20, 0], border: { top: `2px solid ${accent}`, bottom: { width: 1, style: "solid", color: token("colors.border") } } }}>
            <Figure label={t.netPay} value={fmt.money(slip.net)} size={40} color={accent} />
            <Text style={{ fontSize: 15, color: MUTED }}>
              {fill(t.paidInto, { amount: fmt.money(slip.net), bank: e.payment.bank, account: e.payment.account, date: fmt.date(slip.period.payDate, "long") })}
            </Text>
          </Column>

          <Row style={{ gap: 16 }}>
            <Column style={{ width: 140 }}>
              <Figure label={t.grossPay} value={fmt.money(slip.gross)} size={17} />
            </Column>
            <Column style={{ width: 140 }}>
              <Figure label={t.totalDeductions} value={fmt.money(slip.totalDeductions)} size={17} />
            </Column>
            <Column style={{ width: 140 }}>
              <Figure label={t.payDate} value={fmt.date(slip.period.payDate)} size={17} />
            </Column>
          </Row>

          <PayTable title={t.earnings} lines={slip.earnings} total={slip.gross} totalLabel={t.grossPay} fmt={fmt} ytd={false} detail={false} size={15} col={150} hideZero />
          <PayTable title={t.deductions} lines={slip.deductions} total={slip.totalDeductions} totalLabel={t.totalDeductions} fmt={fmt} ytd={false} detail={false} size={15} col={150} hideZero />

          {slip.period.message ? (
            <Column style={{ backgroundColor: token("colors.wash"), padding: [14, 16] }}>
              <Text style={{ fontSize: 14 }}>{slip.period.message}</Text>
            </Column>
          ) : null}

          <Column style={{ gap: 12 }}>
            <Button href={slip.url} style={{ mobile: { width: "100%" } }}>
              {t.openPayslip}
            </Button>
            <Text style={{ fontSize: 14, color: MUTED }}>{t.pdfAttached}</Text>
          </Column>
        </Column>
      </Section>

      <Section style={{ padding: [24, 24, 40], mobile: { padding: [20, 16, 32] } }}>
        <Column style={{ gap: 10 }}>
          <Text style={{ fontSize: 14, color: MUTED }}>{fill(t.questions, { email: c.payrollEmail })}</Text>
          <Text style={{ fontSize: 14, color: MUTED }}>{fill(t.security, { company: c.name })}</Text>
          <Divider />
          <Text style={{ fontSize: 13, color: MUTED }}>
            {c.legalName}, {c.address.join(", ")}
            {c.registration ? `. ${c.registration.label} ${c.registration.value}` : ""}
          </Text>
        </Column>
      </Section>
    </Email>
  );
}
