/**
 * The blocks every output is built from. They are root-agnostic (no Svg, no phone styles), so the
 * same earnings table is the email's, the page's and the PDF's, and a figure cannot drift between them.
 */
import type { ReactNode } from "react";
import { Column, Grid, Row, Span, Table, TableCell, TableRow, Text, defineElement, prop } from "@hyper-elements/react";
import type { Fmt, Line } from "./payroll";
import { INK, MONO, MUTED, RULE } from "./theme";

export const LABEL = { fontSize: 11, lineHeight: 1.4, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase", color: MUTED } as const;

/** The company's mark: its letters on its accent. Drawn with a box and text, so it shows in every email client with images off. */
export const Monogram = defineElement({
  type: "paypacket.Monogram",
  label: "Monogram",
  description: "The company's letters on its accent colour, in place of a logo file.",
  props: {
    letters: prop.text({ label: "Letters", required: true }),
    color: prop.color({ label: "Colour", default: "#1F5C46" }),
    size: prop.number({ label: "Size", default: 40, min: 24, max: 160 }),
  },
  render: ({ letters, color, size }) => (
    <Column style={{ width: size, backgroundColor: color, padding: [Math.round((size - Math.round(size * (letters.length > 2 ? 0.3 : 0.38))) / 2), 0] }}>
      <Text style={{ color: "#FFFFFF", fontSize: Math.round(size * (letters.length > 2 ? 0.3 : 0.38)), fontWeight: 700, lineHeight: 1, textAlign: "center" }}>{letters}</Text>
    </Column>
  ),
});

/** A labelled figure: "Net pay" over "£2,436.44". */
export const Figure = defineElement({
  type: "paypacket.Figure",
  label: "Figure",
  description: "A label over an amount, the slip's key numbers.",
  props: {
    label: prop.text({ label: "Label", required: true }),
    value: prop.text({ label: "Value", required: true }),
    size: prop.number({ label: "Size", default: 20, min: 10, max: 120 }),
    color: prop.color({ label: "Colour", default: INK }),
    labelSize: prop.number({ label: "Label size", default: 11, min: 8, max: 28 }),
  },
  render: ({ label, value, size, color, labelSize }) => (
    <Column style={{ gap: Math.max(4, Math.round(size / 5)) }}>
      <Text style={{ ...LABEL, fontSize: labelSize }}>{label}</Text>
      <Text style={{ fontFamily: MONO, fontWeight: 500, fontSize: size, lineHeight: 1.1, letterSpacing: size > 30 ? -1 : -0.3, color }}>{value}</Text>
    </Column>
  ),
});

const hair = `1px solid ${RULE}`;

/**
 * Earnings or deductions as a table: description (and how it was worked out), this period, and
 * optionally the year to date. Its footer row is the total.
 */
export function PayTable({ title, lines, total, totalLabel, fmt, ytd = true, detail = true, size = 14, col = 120, hideZero = false }: { title: string; lines: Line[]; total: number; totalLabel: string; fmt: Fmt; ytd?: boolean; detail?: boolean; size?: number; col?: number; hideZero?: boolean }) {
  const num = { fontFamily: MONO, textAlign: "right", verticalAlign: "top" } as const;
  const v = Math.round(size * 0.6);
  const pad = [v, 0, v, 10] as [number, number, number, number];
  const totalYtd = lines.reduce((s, l) => s + l.ytd, 0);
  const head = { ...LABEL, fontSize: Math.max(8, Math.round(size * 0.78 * 2) / 2) };
  return (
    <Table style={{ fontSize: size, borderCollapse: "collapse" }}>
      <TableRow header>
        <TableCell style={{ ...head, color: INK, padding: [0, 0, 8], border: { bottom: `1px solid ${INK}` } }}>{title}</TableCell>
        <TableCell style={{ ...head, padding: [0, 0, 8], textAlign: "right", width: col, border: { bottom: `1px solid ${INK}` } }}>{fmt.t.thisPeriod}</TableCell>
        {ytd ? <TableCell style={{ ...head, padding: [0, 0, 8], textAlign: "right", width: col, border: { bottom: `1px solid ${INK}` } }}>{fmt.t.yearToDate}</TableCell> : null}
      </TableRow>
      {lines.filter((l) => !(hideZero && l.amount === 0)).map((l) => (
        <TableRow key={l.code}>
          <TableCell style={{ padding: [v, 12, v, 0], border: { bottom: hair }, verticalAlign: "top" }}>
            {l.label}
            {detail && l.detail ? (
              <>
                <Span style={{ color: MUTED }}>{"\u2002"}</Span>
                <Span style={{ color: MUTED, fontSize: Math.round(size * 0.86) }}>{l.detail}</Span>
              </>
            ) : null}
          </TableCell>
          <TableCell style={{ ...num, padding: pad, border: { bottom: hair }, color: l.amount === 0 ? MUTED : undefined }}>{fmt.amount(l.amount)}</TableCell>
          {ytd ? <TableCell style={{ ...num, padding: pad, border: { bottom: hair }, color: MUTED }}>{fmt.amount(l.ytd)}</TableCell> : null}
        </TableRow>
      ))}
      <TableRow footer>
        <TableCell style={{ padding: [v, 0, 0], fontWeight: 600 }}>{totalLabel}</TableCell>
        <TableCell style={{ ...num, padding: [v, 0, 0, 10], fontWeight: 500 }}>{fmt.amount(total)}</TableCell>
        {ytd ? <TableCell style={{ ...num, padding: [v, 0, 0, 10], color: MUTED }}>{fmt.amount(totalYtd)}</TableCell> : null}
      </TableRow>
    </Table>
  );
}

/** Label-over-value pairs in equal columns: the employee and period details. */
export function Details({ items, columns = 3, size = 14, stack = true }: { items: { label: string; value: ReactNode; mono?: boolean }[]; columns?: number; size?: number; stack?: boolean }) {
  return (
    <Grid columns={columns} stackOnMobile={stack} style={{ gap: 20, rowGap: 16 }}>
      {items.map((it) => (
        <Column key={it.label} style={{ gap: 4 }}>
          <Text style={{ ...LABEL, fontSize: Math.max(8, Math.round(size * 0.76 * 2) / 2) }}>{it.label}</Text>
          <Text style={{ fontSize: size, lineHeight: 1.4, fontFamily: it.mono ? MONO : undefined }}>{it.value}</Text>
        </Column>
      ))}
    </Grid>
  );
}

/** The company line: monogram, name, and its address on one line. */
export function Letterhead({ letters, accent, name, sub, right, size = 40 }: { letters: string; accent: string; name: string; sub?: string; right?: ReactNode; size?: number }) {
  return (
    <Row style={{ alignItems: "center", gap: 14 }} stackOnMobile={false}>
      <Column style={{ width: size }}>
        <Monogram letters={letters} color={accent} size={size} />
      </Column>
      <Column style={{ gap: 2 }}>
        <Text style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, letterSpacing: -0.1 }}>{name}</Text>
        {sub ? <Text style={{ fontSize: 12, color: MUTED, lineHeight: 1.35 }}>{sub}</Text> : null}
      </Column>
      {right ? <Column style={{ alignItems: "end" }}>{right}</Column> : null}
    </Row>
  );
}
