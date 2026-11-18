/**
 * npm run shots: the pictures in the README, from the files npm run make wrote. Needs Chrome (or
 * Playwright's Chromium) for the HTML, and poppler's pdftoppm for the PDF pages. Writes
 *   examples/<file>/screens/   email, page on desktop and phone, PDF pages
 *   examples/<file>/clients/   the email as classic Outlook, Gmail and Apple Mail draw it (sample file only)
 *   docs/hero.png              the README's first picture
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { renderInEmailClients } from "@hyper-elements/email-clients";
import { artefacts, loadData, ROOT, sampleFiles } from "./lib";

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const shoot = async (file: string, out: string, width: number, scale = 1) => {
  const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: scale });
  await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
};

for (const path of await sampleFiles()) {
  const { slug, file } = await loadData(path);
  const dir = join(ROOT, "examples", slug);
  const screens = join(dir, "screens");
  await mkdir(screens, { recursive: true });
  await shoot(join(dir, "email.html"), join(screens, "email.png"), 680);
  await shoot(join(dir, "page.html"), join(screens, "page-desktop.png"), 1280);
  await shoot(join(dir, "page.html"), join(screens, "page-phone.png"), 390, 2);
  execFileSync("pdftoppm", ["-r", "110", "-png", "-singlefile", join(dir, "payslip.pdf"), join(screens, "payslip")]);
  execFileSync("pdftoppm", ["-r", "110", "-png", join(dir, "annual-summary.pdf"), join(screens, "annual")]);
  console.log(`${slug}: screens`);

  if (slug !== "kestrel-freight") continue;
  const clients = join(dir, "clients");
  const tmp = join(ROOT, ".previews");
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  await mkdir(clients, { recursive: true });
  const { previews } = await renderInEmailClients(artefacts(file).email, { emailClients: ["outlook", "gmail", "apple-mail", "gmail-app"], dark: true });
  const findings: Record<string, unknown> = {};
  for (const p of previews) {
    await writeFile(join(tmp, p.filename), p.html);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(pathToFileURL(join(tmp, p.filename)).href);
    await page.waitForSelector("html[data-email-client-ready]", { timeout: 60000 });
    findings[p.filename] = JSON.parse((await page.textContent("#email-client-findings")) ?? "{}");
    await page.locator("#frames iframe").first().screenshot({ path: join(clients, p.filename.replace(/\.html$/, ".png")) });
    await page.close();
  }
  await writeFile(join(clients, "findings.json"), JSON.stringify(findings, null, 2) + "\n");
  await rm(tmp, { recursive: true, force: true });
  console.log(`${slug}: ${previews.length} client previews`);
}

// The hero: the email, the PDF and both cards of the sample, side by side on paper.
const k = join(ROOT, "examples/kestrel-freight");
const img = (p: string) => pathToFileURL(join(k, p)).href;
const hero = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#E6E1D6;font:600 15px Inter,system-ui,sans-serif;color:#17191E}
.w{display:grid;grid-template-columns:520px 640px 560px;gap:36px;padding:56px;align-items:start}
img{display:block;width:100%;border:1px solid #17191E;background:#fff}
p{margin:0 0 12px;letter-spacing:.08em;text-transform:uppercase;font-size:13px;color:#575D67}
.c{display:grid;gap:36px}.crop{height:905px;object-fit:cover;object-position:top}
</style><div class="w"><div><p>Email</p><img class="crop" src="${img("screens/email.png")}"></div><div><p>A4 payslip PDF</p><img src="${img("screens/payslip.png")}"></div><div class="c"><div><p>Chat notice card</p><img src="${img("card-notice.png")}"></div><div><p>Archive card</p><img src="${img("card-archive.png")}"></div></div></div>`;
await mkdir(join(ROOT, "docs"), { recursive: true });
await writeFile(join(ROOT, ".hero.html"), hero);
const page = await browser.newPage({ viewport: { width: 1900, height: 900 } });
await page.goto(pathToFileURL(join(ROOT, ".hero.html")).href);
await page.waitForTimeout(300);
await page.screenshot({ path: join(ROOT, "docs/hero.png"), fullPage: true });
await rm(join(ROOT, ".hero.html"));
await browser.close();
console.log("docs/hero.png");

// Three countries, one template: each sample's A4 slip side by side.
{
  const slugs = ["thornbury-cycle-works", "kestrel-freight", "brueckner-akustik"];
  const cap = ["en-GB · GBP · tax year 2025/26", "en-NG · NGN · tax year 2026", "de-DE · EUR · labels in German"];
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#E6E1D6;font:600 13px Inter,system-ui,sans-serif;color:#575D67}.w{display:grid;grid-template-columns:repeat(3,560px);gap:32px;padding:48px}img{display:block;width:100%;border:1px solid #17191E}p{margin:0 0 10px;letter-spacing:.08em;text-transform:uppercase}</style><div class="w">${slugs.map((s, i) => `<div><p>${cap[i]}</p><img src="${pathToFileURL(join(ROOT, "examples", s, "screens/payslip.png")).href}"></div>`).join("")}</div>`;
  const b2 = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  await writeFile(join(ROOT, ".three.html"), html);
  const p = await b2.newPage({ viewport: { width: 1840, height: 900 } });
  await p.goto(pathToFileURL(join(ROOT, ".three.html")).href);
  await p.screenshot({ path: join(ROOT, "docs/three-countries.png"), fullPage: true });
  await rm(join(ROOT, ".three.html"));
  await b2.close();
  console.log("docs/three-countries.png");
}
