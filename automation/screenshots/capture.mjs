// Manifest-driven, self-healing screenshot capture.
//
// For each manifest entry: open a context (reusing the saved auth state when
// the route requires login), set the color mode deterministically, navigate,
// wait on an explicit locator (never networkidle), apply PII masks, and
// screenshot. An image is only rewritten when it visually differs from the
// committed one. Fulfilled "todo" entries are flipped to "ready". Unresolved
// "todo"s and failures are written to report.md for the PR body.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import {
  IMAGES_DIR,
  STORAGE_STATE,
  REPORT_PATH,
  readManifest,
  writeManifest,
  requireEnv,
  resolveUrl,
  addVercelBypass,
  colorModeInitScript,
} from "./config.mjs";

const NAV_TIMEOUT = 60000;
const LOCATOR_TIMEOUT = 30000;

// Returns true when the two PNG buffers are visually different.
function imageDiffers(existingBuf, nextBuf) {
  if (!existingBuf) return true;
  let a, b;
  try {
    a = PNG.sync.read(existingBuf);
    b = PNG.sync.read(nextBuf);
  } catch {
    return true;
  }
  if (a.width !== b.width || a.height !== b.height) return true;
  const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1 });
  // Tolerate a tiny number of antialiasing-level pixel differences.
  const tolerance = Math.max(50, Math.floor(a.width * a.height * 0.001));
  return diff > tolerance;
}

async function ensureTheme(page, theme) {
  const matches = async () =>
    page.evaluate((t) => {
      const hasDark = document.documentElement.classList.contains("dark");
      return t === "dark" ? hasDark : !hasDark;
    }, theme);

  if (await matches()) return { ok: true, forced: false };

  // Force the documented mechanism and re-verify.
  await page.evaluate((t) => {
    try {
      localStorage.setItem("nuxt-color-mode", t);
      localStorage.setItem("color-mode", t);
    } catch {}
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);

  return { ok: await matches(), forced: true };
}

async function captureEntry(browser, entry, hasAuthState) {
  const result = { name: entry.name, status: "unchanged", note: "" };

  if (entry.auth && !hasAuthState) {
    result.status = "failed";
    result.note = "authenticated route but no saved auth state (setup did not run/sign in)";
    return result;
  }

  const context = await browser.newContext({
    viewport: entry.viewport,
    colorScheme: entry.theme,
    storageState: entry.auth ? STORAGE_STATE : undefined,
  });
  await addVercelBypass(context);
  await context.addInitScript(colorModeInitScript(entry.theme));

  const page = await context.newPage();
  const url = resolveUrl(entry);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await page.locator(entry.waitFor).first().waitFor({ state: "visible", timeout: LOCATOR_TIMEOUT });

    const theme = await ensureTheme(page, entry.theme);
    if (!theme.ok) {
      result.status = "failed";
      result.note = `could not set color mode to "${entry.theme}"`;
      return result;
    }
    if (theme.forced) result.note = "color mode had to be forced after load";

    const masks = (entry.mask || []).map((m) => page.locator(m));
    const nextBuf = await page.screenshot({
      animations: "disabled",
      caret: "hide",
      scale: "css",
      mask: masks,
      maskColor: "#0B0E14",
    });

    const target = path.join(IMAGES_DIR, `${entry.name}.png`);
    const existingBuf = fs.existsSync(target) ? fs.readFileSync(target) : null;

    if (imageDiffers(existingBuf, nextBuf)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
      fs.writeFileSync(target, nextBuf);
      result.status = existingBuf ? "updated" : "created";
    } else {
      result.status = "unchanged";
    }

    // Self-heal: a fulfilled "todo" becomes "ready".
    if (entry.status === "todo") {
      entry.status = "ready";
      result.note = (result.note ? result.note + "; " : "") + "todo fulfilled -> ready";
    }
    return result;
  } catch (err) {
    result.status = "failed";
    result.note = `${url}: ${err.message?.split("\n")[0] || err}`;
    return result;
  } finally {
    await context.close();
  }
}

async function main() {
  requireEnv(["DOCS_APP_BASE_URL", "VERCEL_BYPASS_TOKEN", "E2E_ORG_SLUG"]);
  const manifest = readManifest();
  const hasAuthState = fs.existsSync(STORAGE_STATE);

  const browser = await chromium.launch();
  const results = [];
  try {
    for (const entry of manifest) {
      process.stdout.write(`Capturing ${entry.name} ... `);
      const r = await captureEntry(browser, entry, hasAuthState);
      results.push(r);
      console.log(`${r.status}${r.note ? ` (${r.note})` : ""}`);
    }
  } finally {
    await browser.close();
  }

  // Persist any todo -> ready transitions.
  writeManifest(manifest);

  // Report unresolved work for the PR body.
  const unresolved = results.filter((r) => r.status === "failed");
  const stillTodo = manifest.filter((e) => e.status === "todo");
  const changed = results.filter((r) => r.status === "created" || r.status === "updated");

  const lines = [];
  lines.push(`Captured ${results.length} entries: ` +
    `${changed.length} changed, ` +
    `${results.filter((r) => r.status === "unchanged").length} unchanged, ` +
    `${unresolved.length} failed.`);
  lines.push("");
  if (changed.length) {
    lines.push("### Updated images");
    for (const r of changed) lines.push(`- \`images/${r.name}.png\` (${r.status})`);
    lines.push("");
  }
  if (unresolved.length || stillTodo.length) {
    lines.push("### Needs a human");
    for (const r of unresolved) lines.push(`- ❌ \`${r.name}\` — ${r.note}`);
    for (const e of stillTodo) {
      if (!unresolved.find((r) => r.name === e.name)) {
        lines.push(`- ⏳ \`${e.name}\` — still \`todo\`: ${e.shows || "state not producible in CI"}`);
      }
    }
    lines.push("");
    lines.push("These entries still point at `images/placeholder.png`. Supply the image manually or adjust the manifest route/locator, then re-run the workflow.");
  } else {
    lines.push("All manifest entries are resolved. ✅");
  }

  fs.writeFileSync(REPORT_PATH, lines.join("\n") + "\n");
  console.log(`\nReport written to ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
