/**
 * Pay Packet: the payslip card, 1200 by 630.
 *
 * Two jobs, one template. `variant="notice"` is the image a payroll bot posts in Slack, Teams or
 * WhatsApp on pay day: the month, the pay date and the reference, but no amounts, because chat
 * previews are seen by whoever is near the screen. `variant="archive"` is the thumbnail a
 * document archive or HR portal shows for a stored slip: net pay, gross and deductions, and the
 * year's bars with this period marked, so a year of slips can be scanned at a glance.
 */
import { Canvas, Column, Heading, Path, Rect, Row, Svg, Text } from "@hyper-elements/react";
import { context, type TemplateProps } from "../src/context";
import { Figure, LABEL, Letterhead } from "../src/parts";
import { YearBars } from "../src/chart";
import { INK, MONO, MUTED, PAPER, RULE } from "../src/theme";

export const meta = {
  title: "Pay Packet payslip card",
  description: "A 1200 by 630 card: a pay-day notice with no amounts for chat, or an archive thumbnail with the figures.",
  root: "Canvas",
};

/** A payslip drawn as shapes: a sheet with ruled lines, the net-pay band in the accent, and a torn-off perforated edge. */
function SlipDrawing({ accent }: { accent: string }) {
  const rows = [0, 1, 2, 3, 4, 5];
  return (
    <Svg width={340} height={430} viewBox="0 0 340 430" title="A payslip">
      <Rect x={18} y={18} width={300} height={400} style={{ fill: "#D9D4C7" }} />
      <Rect x={6} y={6} width={300} height={400} style={{ fill: "#FFFFFF", stroke: INK, strokeWidth: 2 }} />
      <Rect x={30} y={32} width={40} height={40} style={{ fill: accent }} />
      <Rect x={82} y={38} width={120} height={10} style={{ fill: INK }} />
      <Rect x={82} y={56} width={84} height={8} style={{ fill: RULE }} />
      {rows.map((r) => (
        <Rect key={`l${r}`} x={30} y={104 + r * 30} width={r % 3 === 2 ? 110 : 150} height={8} style={{ fill: "#C9C3B6" }} />
      ))}
      {rows.map((r) => (
        <Rect key={`a${r}`} x={216} y={104 + r * 30} width={66} height={8} style={{ fill: INK }} />
      ))}
      {rows.map((r) => (
        <Rect key={`h${r}`} x={30} y={120 + r * 30} width={252} height={1} style={{ fill: RULE }} />
      ))}
      <Rect x={30} y={300} width={252} height={64} style={{ fill: accent }} />
      <Rect x={46} y={316} width={60} height={8} style={{ fill: "#FFFFFF" }} />
      <Rect x={46} y={334} width={140} height={16} style={{ fill: "#FFFFFF" }} />
      <Path d={`M6 380 ${Array.from({ length: 15 }, (_, i) => `L${6 + i * 20 + 10} ${i % 2 ? 380 : 392} `).join("")} L306 380`} style={{ fill: "transparent", stroke: INK, strokeWidth: 1 }} />
    </Svg>
  );
}

export default function PayslipCard(props: TemplateProps & { variant?: "notice" | "archive" }) {
  const { file, year, slip, fmt, theme, monthName, accent, lang } = context(props);
  const { t, fill } = fmt;
  const c = file.company;
  const variant = props.variant ?? "notice";
  return (
    <Canvas theme={theme} width={1200} height={630} lang={lang} title={`${c.name} · ${fill(t.payslipFor, { period: monthName })}`} style={{ padding: 0, backgroundColor: PAPER, fontFamily: "Inter" }}>
      <Row style={{ height: 630, alignItems: "stretch" }}>
        <Column style={{ height: 630, padding: [60, 64], gap: 0, justifyContent: "space-between" }}>
          <Letterhead letters={c.monogram} accent={accent} name={c.name} sub={`${t.payslip} · ${t.taxYear} ${file.settings.taxYear}`} size={52} />
          {variant === "notice" ? (
            <Column style={{ gap: 18 }}>
              <Text style={{ ...LABEL, fontSize: 18, color: accent }}>{t.slipReady}</Text>
              <Heading level={1} style={{ fontSize: 84, lineHeight: 1, letterSpacing: -3 }}>
                {monthName}
              </Heading>
              <Text style={{ fontSize: 24, color: MUTED }}>{fill(t.openInPortal, { company: c.name })}</Text>
            </Column>
          ) : (
            <Column style={{ gap: 22 }}>
              <Text style={{ ...LABEL, fontSize: 18 }}>{monthName}</Text>
              <Figure label={t.netPay} value={fmt.money(slip.net)} size={76} color={accent} labelSize={16} />
              <Row style={{ gap: 40 }}>
                <Figure label={t.grossPay} value={fmt.money(slip.gross)} size={26} labelSize={14} />
                <Figure label={t.totalDeductions} value={fmt.money(slip.totalDeductions)} size={26} labelSize={14} />
              </Row>
            </Column>
          )}
          <Row style={{ gap: 40, padding: [22, 0, 0], border: { top: `2px solid ${INK}` } }}>
            <Column style={{ gap: 6 }}>
              <Text style={{ ...LABEL, fontSize: 14 }}>{t.payDate}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 24 }}>{fmt.date(slip.period.payDate)}</Text>
            </Column>
            <Column style={{ gap: 6 }}>
              <Text style={{ ...LABEL, fontSize: 14 }}>{t.reference}</Text>
              <Text style={{ fontFamily: MONO, fontSize: 24 }}>{slip.reference}</Text>
            </Column>
          </Row>
        </Column>
        <Column style={{ width: 420, height: 630, backgroundColor: variant === "notice" ? "#E6E1D6" : "#FFFFFF", padding: variant === "notice" ? [80, 38] : [60, 44], justifyContent: "center", alignItems: "center", border: { left: `2px solid ${INK}` } }}>
          {variant === "notice" ? (
            <SlipDrawing accent={accent} />
          ) : (
            <Column style={{ gap: 18 }}>
              <Text style={{ ...LABEL, fontSize: 14, color: INK }}>{`${t.netPay} · ${t.taxYear} ${file.settings.taxYear}`}</Text>
              <YearBars year={year} file={file} current={slip.period.id} width={330} height={260} accent={accent} />
              <Row style={{ gap: 16 }}>
                <Figure label={t.yearToDate} value={fmt.money(slip.ytd.net)} size={22} labelSize={13} />
              </Row>
            </Column>
          )}
        </Column>
      </Row>
    </Canvas>
  );
}
