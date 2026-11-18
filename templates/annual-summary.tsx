/**
 * Pay Packet: the annual pay summary.
 *
 * What an employee needs at the end of the tax year, or when a lender asks for "a year of
 * payslips": every period on one page with its reference, the year as a chart, and on the second
 * page each earning, deduction and employer contribution totalled. Made from the same file as the
 * twelve slips, so its totals are their sums by construction.
 */
import { Column, Document, Grid, Heading, PageFooter, PageHeader, PageNumber, Rect, Row, Svg, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { context, type TemplateProps } from "../src/context";
import { Details, Figure, LABEL, Letterhead } from "../src/parts";
import { yearByLine } from "../src/payroll";
import { YearBars } from "../src/chart";
import { INK, MONO, MUTED, RULE } from "../src/theme";

export const meta = {
  title: "Pay Packet annual summary",
  description: "A tax year on two A4 pages: every period with its reference and a chart, then each line totalled.",
  root: "Document",
};

const WIDTH = 706;
const hair = `1px solid ${RULE}`;
const head = { ...LABEL, fontSize: 8.5, padding: [0, 0, 7], border: { bottom: `1px solid ${INK}` } } as const;

export default function AnnualSummary(props: TemplateProps) {
  const { file, year, fmt, theme, accent, lang } = context(props);
  const { t, fill } = fmt;
  const c = file.company;
  const e = file.employee;
  const last = year.slips.at(-1)!;
  const num = { fontFamily: MONO, textAlign: "right", padding: [7, 0], border: { bottom: hair } } as const;
  const title = `${t.annualSummary} ${file.settings.taxYear}`;

  const header = (
    <PageHeader style={{ padding: [0, 0, 14], border: { bottom: `1px solid ${INK}` } }}>
      <Row style={{ alignItems: "center" }}>
        <Column>
          <Letterhead letters={c.monogram} accent={accent} name={c.legalName} sub={c.address.join(" · ")} size={36} />
        </Column>
        <Column style={{ width: 220 }}>
          <Text style={{ fontSize: 9, color: MUTED, textAlign: "right" }}>{`${e.name} · ${e.id}`}</Text>
        </Column>
      </Row>
    </PageHeader>
  );

  const lineTable = (titleText: string, rows: ReturnType<typeof yearByLine>, totalLabel: string) => (
    <Table style={{ fontSize: 10.5 }}>
      <TableRow header>
        <TableCell style={{ ...head, color: INK }}>{titleText}</TableCell>
        <TableCell style={{ ...head, width: 90, textAlign: "right" }}>{t.periodsPaid}</TableCell>
        <TableCell style={{ ...head, width: 130, textAlign: "right" }}>{t.totals}</TableCell>
      </TableRow>
      {rows.map((r) => (
        <TableRow key={r.code}>
          <TableCell style={{ padding: [7, 12, 7, 0], border: { bottom: hair } }}>{r.label}</TableCell>
          <TableCell style={{ ...num, color: MUTED }}>{String(r.periods)}</TableCell>
          <TableCell style={num}>{fmt.amount(r.total)}</TableCell>
        </TableRow>
      ))}
      <TableRow footer>
        <TableCell style={{ padding: [8, 0, 0], fontWeight: 600 }}>{totalLabel}</TableCell>
        <TableCell />
        <TableCell style={{ fontFamily: MONO, textAlign: "right", padding: [8, 0, 0], fontWeight: 500 }}>{fmt.amount(rows.reduce((s, r) => s + r.total, 0))}</TableCell>
      </TableRow>
    </Table>
  );

  const footer = (
    <PageFooter style={{ padding: [10, 0, 0], border: { top: hair } }}>
      <Row>
        <Text style={{ fontSize: 8.5, color: MUTED }}>{fill(t.confidential, { name: e.name })}</Text>
        <Column style={{ width: 90 }}>
          <Text style={{ fontSize: 8.5, color: MUTED, textAlign: "right" }}>
            {t.page} <PageNumber /> {t.of} <PageNumber total />
          </Text>
        </Column>
      </Row>
    </PageFooter>
  );

  return (
    <Document theme={theme} size="A4" margin={[36, 44, 36, 44]} lang={lang} title={`${title} · ${e.name}`} style={{ fontSize: 10.5 }}>
      {header}
      <Document.Page style={{ gap: 20 }}>
        <Column style={{ gap: 4, padding: [6, 0, 0] }}>
          <Text style={{ ...LABEL, fontSize: 9 }}>{`${e.name} · ${e.role} · ${e.taxId.label} ${e.taxId.value}`}</Text>
          <Heading level={1} style={{ fontSize: 26, letterSpacing: -0.6 }}>
            {title}
          </Heading>
        </Column>

        <Grid columns={4} style={{ gap: 12 }}>
          {[
            [t.grossPay, fmt.money(year.totals.gross), INK],
            [t.totalDeductions, fmt.money(year.totals.deductions), INK],
            [t.netPay, fmt.money(year.totals.net), accent],
            [t.employerContributions, fmt.money(year.totals.employer), INK],
          ].map(([label, value, color]) => (
            <Column key={label} style={{ padding: [10, 0, 0], border: { top: `2px solid ${color}` } }}>
              <Figure label={label} value={value} size={17} labelSize={8} color={color} />
            </Column>
          ))}
        </Grid>

        <Column style={{ gap: 8 }}>
          <Text style={{ ...LABEL, fontSize: 8.5, color: INK }}>{t.netByMonth}</Text>
          <YearBars year={year} file={file} current={last.period.id} width={WIDTH} height={110} accent={accent} stacked muted="#B9B2A3" />
          <Grid columns={Math.max(file.periods.length, 12)} style={{ gap: 0 }}>
            {file.periods.map((p) => (
              <Text key={p.id} style={{ fontSize: 8, color: MUTED, textAlign: "center" }}>
                {fmt.monthShort(p.start)}
              </Text>
            ))}
          </Grid>
          <Row style={{ gap: 6, alignItems: "center" }}>
            <Svg width={8} height={8}>
              <Rect width={8} height={8} style={{ fill: accent }} />
            </Svg>
            <Column style={{ width: 110 }}>
              <Text style={{ fontSize: 8.5, color: MUTED }}>{t.netPay}</Text>
            </Column>
            <Svg width={8} height={8}>
              <Rect width={8} height={8} style={{ fill: "#B9B2A3" }} />
            </Svg>
            <Text style={{ fontSize: 8.5, color: MUTED }}>{t.deductions}</Text>
          </Row>
        </Column>

        <Table style={{ fontSize: 10 }}>
          <TableRow header>
            <TableCell style={{ ...head, color: INK }}>{t.month}</TableCell>
            <TableCell style={{ ...head, width: 120 }}>{t.reference}</TableCell>
            <TableCell style={{ ...head, width: 80 }}>{t.payDate}</TableCell>
            <TableCell style={{ ...head, width: 96, textAlign: "right" }}>{t.gross}</TableCell>
            <TableCell style={{ ...head, width: 96, textAlign: "right" }}>{t.deductions}</TableCell>
            <TableCell style={{ ...head, width: 104, textAlign: "right" }}>{t.netPay}</TableCell>
          </TableRow>
          {file.periods.map((p) => {
            const s = year.slips.find((x) => x.period.id === p.id);
            const cell = { padding: [6, 0], border: { bottom: hair } } as const;
            const n = { ...cell, fontFamily: MONO, textAlign: "right" } as const;
            return s ? (
              <TableRow key={p.id}>
                <TableCell style={cell}>{fmt.month(p.start)}</TableCell>
                <TableCell style={{ ...cell, fontFamily: MONO, fontSize: 8.5, color: MUTED }}>{s.reference}</TableCell>
                <TableCell style={{ ...cell, fontFamily: MONO, fontSize: 9 }}>{fmt.date(p.payDate, "short")}</TableCell>
                <TableCell style={n}>{fmt.amount(s.gross)}</TableCell>
                <TableCell style={{ ...n, color: MUTED }}>{fmt.amount(s.totalDeductions)}</TableCell>
                <TableCell style={{ ...n, fontWeight: 500 }}>{fmt.amount(s.net)}</TableCell>
              </TableRow>
            ) : (
              <TableRow key={p.id}>
                <TableCell style={cell}>{fmt.month(p.start)}</TableCell>
                <TableCell colSpan={5} style={{ ...cell, color: MUTED }}>{t.noSlip}</TableCell>
              </TableRow>
            );
          })}
          <TableRow footer>
            <TableCell colSpan={3} style={{ padding: [8, 0, 0], fontWeight: 600 }}>{t.totals}</TableCell>
            <TableCell style={{ fontFamily: MONO, textAlign: "right", padding: [8, 0, 0] }}>{fmt.amount(year.totals.gross)}</TableCell>
            <TableCell style={{ fontFamily: MONO, textAlign: "right", padding: [8, 0, 0], color: MUTED }}>{fmt.amount(year.totals.deductions)}</TableCell>
            <TableCell style={{ fontFamily: MONO, textAlign: "right", padding: [8, 0, 0], fontWeight: 500, color: accent }}>{fmt.amount(year.totals.net)}</TableCell>
          </TableRow>
        </Table>
      </Document.Page>

      <Document.Page style={{ gap: 26 }}>
        <Column style={{ gap: 4, padding: [6, 0, 0] }}>
          <Text style={{ ...LABEL, fontSize: 9 }}>{title}</Text>
          <Heading level={2} style={{ fontSize: 18 }}>
            {`${t.earnings}, ${t.deductions.toLowerCase()}, ${t.employerContributions.toLowerCase()}`}
          </Heading>
        </Column>
        {lineTable(t.earnings, yearByLine(year, "earnings"), t.grossPay)}
        {lineTable(t.deductions, yearByLine(year, "deductions"), t.totalDeductions)}
        {last.employer.length ? lineTable(t.employerContributions, yearByLine(year, "employer"), t.totals) : null}
        <Row style={{ gap: 28 }}>
          <Column style={{ backgroundColor: "#ECE8DF", padding: [14, 16] }}>
            <Details
              columns={3}
              size={10.5}
              items={[
                { label: t.periodsPaid, value: `${year.slips.length} / ${file.periods.length}`, mono: true },
                { label: t.averageNet, value: fmt.money(Math.round(year.totals.net / Math.max(1, year.slips.length))), mono: true },
                ...(last.period.balances ?? []).map((b) => ({ label: b.label, value: b.value })),
              ]}
            />
          </Column>
        </Row>
        <Text style={{ fontSize: 9, color: MUTED }}>{fill(t.questions, { email: c.payrollEmail })}</Text>
      </Document.Page>
      {footer}
    </Document>
  );
}
