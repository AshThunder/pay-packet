/**
 * The year as bars, drawn in Svg for the PDF and the card (an Email gets no Svg). One bar per
 * period of the tax year: paid periods filled, the slip's own period in the accent, periods still
 * to come drawn as a baseline tick, so a slip says where in the year it sits.
 */
import { Line as SvgLine, Rect, Svg } from "@hyper-elements/react";
import type { PayrollFile } from "./types";
import type { Year } from "./payroll";
import { INK, RULE } from "./theme";

export function YearBars({ year, file, current, width, height, accent, stacked = false, muted = "#C9C3B6" }: { year: Year; file: PayrollFile; current?: string; width: number; height: number; accent: string; stacked?: boolean; muted?: string }) {
  const periods = file.periods;
  const count = Math.max(periods.length, 12);
  const slot = width / count;
  const bar = Math.max(4, Math.round(slot * 0.56));
  const max = Math.max(...year.slips.map((s) => (stacked ? s.gross : s.net)), 1);
  const plot = height - 2;
  const currentIndex = current ? periods.findIndex((p) => p.id === current) : periods.length - 1;
  const bars = [];
  for (let i = 0; i < count; i++) {
    const p = periods[i];
    const slip = p ? year.slips.find((s) => s.period.id === p.id) : undefined;
    const x = Math.round(i * slot + (slot - bar) / 2);
    const future = i > currentIndex || !p;
    if (!slip || future) {
      bars.push(<Rect key={`t${i}`} x={x} y={plot - 3} width={bar} height={3} style={{ fill: RULE }} />);
      continue;
    }
    const isCurrent = !stacked && i === currentIndex;
    const netH = Math.max(2, Math.round((slip.net / max) * (plot - 4)));
    if (stacked) {
      const dedH = Math.round((slip.totalDeductions / max) * (plot - 4));
      bars.push(<Rect key={`d${i}`} x={x} y={plot - netH - dedH} width={bar} height={dedH} style={{ fill: isCurrent ? INK : muted }} />);
    }
    bars.push(<Rect key={`n${i}`} x={x} y={plot - netH} width={bar} height={netH} style={{ fill: isCurrent || stacked ? accent : muted }} />);
  }
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} title="Net pay by period">
      {bars}
      <SvgLine x1={0} y1={plot + 0.5} x2={width} y2={plot + 0.5} style={{ stroke: INK, strokeWidth: 1 }} />
    </Svg>
  );
}
