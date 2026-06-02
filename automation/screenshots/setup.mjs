// One-time auth setup: sign in to Clerk programmatically, set the Vercel
// deployment-protection bypass cookie, and persist the browser storage state
// so the capture step can reuse the session without signing in per shot.
import fs from "node:fs";
import { chromium } from "playwright";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  AUTH_DIR,
  STORAGE_STATE,
  BASE_URL,
  ORG_SLUG,
  requireEnv,
  addVercelBypass,
} from "./config.mjs";

async function main() {
  requireEnv([
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "E2E_USER_EMAIL",
    "E2E_USER_PASSWORD",
    "VERCEL_BYPASS_TOKEN",
  ]);

  // Loads the Clerk publishable/secret keys and fetches a Testing Token so
  // programmatic sign-in is not blocked by bot protection.
  await clerkSetup();

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await addVercelBypass(context);

  const page = await context.newPage();
  await setupClerkTestingToken({ page });

  // Land on the app so Clerk's JS is loaded before signing in. Never wait on
  // networkidle — the app keeps a LaunchDarkly stream open.
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_USER_EMAIL,
      password: process.env.E2E_USER_PASSWORD,
    },
  });

  // Visit an authenticated route to confirm the session is live before saving.
  const orgHome = ORG_SLUG ? `${BASE_URL}/${ORG_SLUG}` : BASE_URL;
  await page.goto(orgHome, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!window.Clerk?.session, null, { timeout: 30000 });

  await context.storageState({ path: STORAGE_STATE });
  console.log(`Saved authenticated storage state to ${STORAGE_STATE}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
