import { defineTheme, extendTheme } from "@hyper-elements/react";
import type { PayrollFile } from "./types";

/**
 * Pay Packet's look, written once for all four roots.
 *
 * A payslip is a document people keep and check, so it reads like one: warm paper, black ink,
 * hairline rules and a single brand accent for the one figure that matters (net pay). Words are
 * set in Inter; every amount, date and reference is set in IBM Plex Mono, the way payslips were
 * printed, so columns of figures line up in every output without relying on tabular figures.
 */
export const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const MONO = "'IBM Plex Mono', Menlo, Consolas, 'Courier New', monospace";

export const INK = "#17191E";
export const MUTED = "#575D67";
export const RULE = "#D9D5CB";
export const PAPER = "#F4F2ED";
export const WASH = "#ECE8DF";

export const payPacket = defineTheme({
  colors: {
    background: PAPER,
    foreground: INK,
    primary: "#1F5C46",
    primaryForeground: "#FFFFFF",
    muted: MUTED,
    border: RULE,
    card: "#FFFFFF",
    wash: WASH,
  },
  fonts: { body: SANS, heading: SANS, mono: MONO },
  fontSizes: { body: 15, small: 13, label: 11 },
  lineHeights: { body: 1.5 },
  elements: {
    Heading: {
      fontWeight: 700,
      by: {
        level: {
          1: { fontSize: 30, lineHeight: 1.15, letterSpacing: -0.5 },
          2: { fontSize: 18, lineHeight: 1.3, letterSpacing: -0.2 },
          3: { fontSize: 12, lineHeight: 1.3, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, color: "{colors.muted}" },
        },
      },
    },
    Button: { borderRadius: 4, padding: [14, 24], fontWeight: 600, hover: { backgroundColor: INK } },
    Divider: { borderTop: `1px solid ${RULE}` },
  },
  styles: {
    card: { backgroundColor: "{colors.card}", padding: 32, gap: 24, border: `1px solid ${RULE}` },
    label: { fontSize: 11, lineHeight: 1.4, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase", color: "{colors.muted}" },
    figure: { fontFamily: "{fonts.mono}", fontWeight: 500, letterSpacing: -0.3 },
  },
  formats: {
    document: { colors: { background: "#FFFFFF" }, fontSizes: { body: 10.5 }, lineHeights: { body: 1.45 } },
    canvas: { colors: { background: PAPER } },
  },
});

/** One company's theme: the shared look with its own accent. */
export function themeFor(file: PayrollFile) {
  return extendTheme(payPacket, { colors: { primary: file.company.accent } });
}
