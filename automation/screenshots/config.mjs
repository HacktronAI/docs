// Shared configuration and helpers for the screenshot pipeline.
//
// All secrets come from the environment — nothing is hardcoded. See the
// repository README for the list of required secrets.
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));

// Repo layout: <root>/automation/screenshots/<this file>
export const REPO_ROOT = path.resolve(here, "..", "..");
export const MANIFEST_PATH = path.join(REPO_ROOT, "automation", "screenshots.json");
export const IMAGES_DIR = path.join(REPO_ROOT, "images");
export const AUTH_DIR = path.join(here, ".auth");
export const STORAGE_STATE = path.join(AUTH_DIR, "state.json");
export const REPORT_PATH = path.join(here, "report.md");

// The staging app to screenshot. Defaults to staging; override with the secret.
export const BASE_URL = (process.env.DOCS_APP_BASE_URL || "https://staging.hacktron.ai").replace(/\/$/, "");
export const ORG_SLUG = process.env.E2E_ORG_SLUG || "";

export function requireEnv(names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
}

export function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

export function writeManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

// Authed routes are served under the org slug at runtime; unauthenticated
// routes are used as-is. The slug is never baked into the committed manifest.
export function resolveUrl(entry) {
  const prefix = entry.auth && ORG_SLUG ? `/${ORG_SLUG}` : "";
  return `${BASE_URL}${prefix}${entry.route}`;
}

// Vercel deployment protection is bypassed with the _vercel_jwt COOKIE.
// Using a cookie (not extraHTTPHeaders) keeps Clerk/Stripe CORS intact.
export function vercelBypassCookie() {
  const token = process.env.VERCEL_BYPASS_TOKEN;
  if (!token) return null;
  return { name: "_vercel_jwt", value: token, url: BASE_URL };
}

export async function addVercelBypass(context) {
  const cookie = vercelBypassCookie();
  if (cookie) await context.addCookies([cookie]);
}

// Deterministic color mode: set the Nuxt color-mode localStorage keys before
// any app code runs. Combined with the browser-level colorScheme and a
// post-load verification in capture.mjs.
export function colorModeInitScript(theme) {
  return `(() => { try {
    localStorage.setItem('nuxt-color-mode', ${JSON.stringify(theme)});
    localStorage.setItem('color-mode', ${JSON.stringify(theme)});
  } catch (e) {} })();`;
}
