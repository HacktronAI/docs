# Hacktron Docs Audit — drift vs `iva/origin/main` and `hecktron/origin/main`

**Date:** 2026-05-16
**Audited by:** Automated cross-reference against code on `origin/main` of `iva` and `hecktron`.
**Scope:** Every page in the docs site except the new `platform/billing/*` pages added in this branch.
**Status:** This audit identifies drift. Fixes are NOT applied on this branch (per scope decision — billing additions only). Track fixes in a follow-up PR.

All `file:line` citations are against `origin/main` of either repo at the time of writing. Hyperlinks below use repo-relative paths so they keep working after merge.

---

## Top-10 prioritized fixes

Address these first — they are correctness bugs that will mislead API consumers, billing admins, or new users today.

1. **Remove `impact`, `root_cause`, `remediation` from every Findings page.** These fields do not exist on the `Finding` entity (`apps/iva/src/findings/finding.entity.ts:40-80`) and are not returned by `RestExportService.toFindingResponse` (`apps/iva/src/rest/services/rest-export.service.ts:176-192`). SDK consumers will see missing fields. Pages: `api-reference/findings/list-findings.mdx`, `api-reference/findings/get-finding.mdx`.
2. **Fix `github_installation_id` required/optional mismatch** in `api-reference/cost-estimations/create-cost-estimation.mdx`. Docs say "No"; DTO requires it for `connected` repos with no `@IsOptional()` (`apps/iva/src/cost-estimation/cost-estimation.dto.ts:51-54`).
3. **Correct "200 PRs per seat" trial claim** in `platform/billing-access.mdx`. The per-seat PR cap defaults to **50**, configurable (`apps/iva/src/seat/dev/dev-seat-policy.service.ts:44` `DEFAULT_SEAT_LIMIT = 50`). The number 200 is the file-change cap per PR (`apps/iva/src/seat/dev/dev-seat-pr-usage.service.ts:7`), an unrelated knob.
4. **Correct pentest starter privilege**. Both `platform/billing-access.mdx` and `platform/pentests.mdx` say "owner-only". The UI gates on `isAdmin = Owner OR Admin` (`hecktron/apps/frontend/app/components/app/pentest/run-button.vue:32` and `composables/organization.ts:51-54`); backend allows any `MEMBER` (`apps/iva/src/scan/scan.controller.ts:222`). Only **credit purchase** is owner-only (`apps/iva/src/pentest-credit/pentest-credit.controller.ts:124,146`). Either tighten the controller guard or fix the docs.
5. **Reduce the Roles table from 5 to 4 rows** in `platform/billing-access.mdx`. The `OrgRole` enum has exactly four values: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` (`apps/iva/src/organization/organization-member.entity.ts:8-13`). "Unassigned" is a People-page UI label for discovered developers, not a role.
6. **Fix the Swagger UI URL.** `api-reference/introduction.mdx` and `api-reference/authentication.mdx` reference `/docs`; the public path is `/api-docs` (`apps/iva/src/main.ts:153`). `/docs` is basic-auth gated internal (`main.ts:103-114`).
7. **Document all three throttlers in `api-reference/rate-limits.mdx`.** Code runs `short` (10 req/s), `medium` (20 req/10s), and `long` (100 req/min) concurrently (`apps/iva/src/config/throttler.config.ts:10-19`). Docs mention only the 100/min number. Also add the per-route caps: `POST /v1/scans` (2/s, 5/10s, 20/min) and `POST /v1/cost-estimations` long: 5/10min, plus the org-level "max 3 active estimations" 429 (`cost-estimation.service.ts:1211-1216`).
8. **Document GitLab and Bitbucket as first-class SCM providers** in `platform/code-reviews.mdx`. iva ships full integrations (`apps/iva/src/gitlab/gitlab.controller.ts`, `apps/iva/src/bitbucket/bitbucket.controller.ts`) and the frontend has SCM connection components for both.
9. **Update onboarding labels and drop CLI references** in `platform/quickstart.mdx`. The wizard label is "In a team" not "With my team" (`hecktron/apps/frontend/i18n/locales/en.json` `onboarding.team-or-solo.team.title`). The CLI and IDE extensions are deprecated (`index.mdx` already says so). Remove the `hacktron login` mention. Also fix the "vulnerabiltiies" typo in `index.mdx:7`.
10. **Fix billing permissions section** in `platform/billing-access.mdx`. Promotion/coupon codes are **Owner-only**, not Admin+ (`apps/iva/src/payments/promotion-code.controller.ts:46,66,95,119`). Add a "Spillover billing" subsection covering the toggle + LD flag + ACTIVE-sub triple gate.

---

## Per-page audit

### `index.mdx`

**Status:** ✅ Accurate, minor polish.

- **Typo:** "vulnerabiltiies" on line 7 → "vulnerabilities".
- **Missing:** No card grid linking to Privacy / Security / Trust Center. Add a card group at the bottom.
- **Style:** "Hacktron Workbench (Deprecated)" section has no actionable destination. Consider removing.

---

### `platform/quickstart.mdx`

**Status:** ❌ Outdated.

| Claim | Reality | Fix |
| --- | --- | --- |
| "By myself or With my team" | UI labels are "By myself" / "In a team" (`hecktron/apps/frontend/i18n/locales/en.json` `onboarding.team-or-solo.team.title` = "In a team") | Match UI exactly. |
| "Choose By myself if you want the individual path for the CLI and VS Code extension" | Solo path drops users into GitHub OAuth (`hecktron/apps/frontend/app/components/app/onboarding/steps/connect-github.vue:1-35`). No CLI/VS Code path exists; index.mdx already says they are deprecated. | Rewrite: "By myself" sets up a single-developer GitHub OAuth flow on personal repos. |
| "If you arrived from `hacktron login`…" | CLI is deprecated. | Remove bullet. |
| Step 4: "if an owner needs to add payment information, manage seats, or buy credits" | Owners do payment + credits; **Admins** manage seats (`apps/iva/src/seat/seat.controller.ts:135-184` — `assignSeat` is `@RequireOrgRole(OrgRole.ADMIN)`). | Split: owners do payment/credits; admins manage seats. |

**Missing:**
- Slack integration onboarding step (`hecktron/apps/frontend/app/components/app/onboarding/steps/slack-connect.vue`).
- "Start trial" modal that owners see after onboarding (`apps/frontend/app/components/app/billing/start-trial-modal.vue`).
- Link forward to the Billing page glossary for "Dev seat".

**Style:** The two "Pages overview" lists (lines 47–55 and 38–46) are largely duplicative — consolidate.

---

### `platform/code-reviews.mdx`

**Status:** ⚠️ Partially outdated.

| Claim | Reality | Fix |
| --- | --- | --- |
| Only GitHub is mentioned. | iva supports **GitHub, GitLab, and Bitbucket** (`apps/iva/src/gitlab/gitlab.controller.ts`, `apps/iva/src/bitbucket/bitbucket.controller.ts`; frontend SCM components present for both). | Document all three SCM providers. |
| Implicit: PR-coverage config is just on/off per branch. | Repos also have `issue_creation_toggle` (Linear/Jira per repo) and PR-scan branches selection (`apps/frontend/app/components/app/repositories/{issue-creation-toggle,pr-scan-branches-select,pr-scans-toggle}.vue`). | Mention per-repo branch selection and issue-creation toggle. |
| No mention of PR file-count cap. | A PR with > 200 changed files is rejected with `PR_TOO_LARGE` (`apps/iva/src/seat/dev/dev-seat-pr-usage.service.ts:7` `FILE_CHANGE_CAP = 200`; user message at `dev-seat-policy.service.ts:185`). | Add "PRs larger than 200 changed files are skipped — split the PR" to "If a PR is not being reviewed". |

**Missing:**
- Supported notification integrations (Slack, Jira, Linear) that surface review results.
- "What's next" link forward to **Findings** page.

---

### `platform/billing-access.mdx`

**Status:** ❌ Outdated — multiple factual errors.

| Claim | Reality | Fix |
| --- | --- | --- |
| 5 roles including "Unassigned". | `OrgRole` has 4: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` (`apps/iva/src/organization/organization-member.entity.ts:8-13`). "Unassigned" is a People-page UI fallback for developers discovered via PR activity (`hecktron/apps/frontend/app/components/app/organization/people/members-table.vue:171,206,283,299`). | Reduce to 4 rows. Add a paragraph: "Unassigned" is a People-page label, not a role. |
| Owner = "...pentest starts" | UI gate: Owner+Admin (`apps/frontend/app/components/app/pentest/run-button.vue:32`). Backend gate: any Member (`apps/iva/src/scan/scan.controller.ts:222`). Only **credit purchases** are owner-only (`apps/iva/src/pentest-credit/pentest-credit.controller.ts:124,146`). | Move pentest start off Owner row. Add "Pentest credit purchases" under Owner. |
| Trial: "200 PRs per seat" | Per-seat PR limit defaults to **50** (`apps/iva/src/seat/dev/dev-seat-policy.service.ts:44` `DEFAULT_SEAT_LIMIT = 50`). The 200 is the per-PR file-change cap, an unrelated knob (`dev-seat-pr-usage.service.ts:7`). | Change to "50 PRs per seat per period (configurable)." Remove 200 from this context. |
| Trial: "lasts 14 days" | Default 14 days (`apps/iva/src/payments/stripe.service.ts:186`), but `trial_days_override` on the org overrides (`payments/trial.service.ts:103`). | Add: "Default 14 days; some orgs have a different negotiated duration." |
| "Admin+ can apply coupon codes" | Promotion codes are **Owner-only** (`apps/iva/src/payments/promotion-code.controller.ts:46,66,95,119`). | Fix to Owner-only. |
| Spillover billing not mentioned. | Owner-only toggle (`apps/iva/src/seat/seat.controller.ts:100`, `@RequireOrgRole(OrgRole.OWNER)`); gated by `spillover_billing_enabled` + LD `prOverageBillingEnabled` + ACTIVE sub (`apps/iva/src/seat/dev/dev-seat-policy.service.ts:856-861`). | Add a "Spillover billing" subsection. (Now covered in detail by the new `platform/billing/spillover.mdx` page on this branch.) |
| Trial: "begins when any organization owner adds payment information" | Trial endpoint is owner-only (`payments/subscription.controller.ts:74-77`); `has_used_trial` is permanent (`payments/trial.service.ts:141-145`). | Add: "A trial can only be started once per organization — after expiry/cancel, the org converts via Resubscribe." |
| `dev_seat_limit` not documented. | Default 10 during trial (`trial.service.ts:155-156`), 50 otherwise (`dev-seat-policy.service.ts:235`). | Document the seat cap and how to raise it. |

**Missing:**
- Pentest credit pricing/packaging (price-preview endpoint exists at `apps/iva/src/pentest-credit/pentest-credit.controller.ts:97-122`).
- Coupon/promotion code flow (dedicated endpoints exist, undocumented).
- Seat audit trail (`dev_seat_audit_log` entity surfaces in the History tab).

**Style:**
- Order roles least → most privilege.
- Collapse the two repetitive "Example scenarios" tables into a shared template.

---

### `platform/pentests.mdx`

**Status:** ⚠️ Partially outdated.

| Claim | Reality | Fix |
| --- | --- | --- |
| "Only organization owners can start one right now" | UI: Owner+Admin (`hecktron/apps/frontend/app/components/app/pentest/run-button.vue:32`). Backend: any Member (`apps/iva/src/scan/scan.controller.ts:222`). Credit purchase only is owner-only. | Rewrite: "Admins and Owners can start pentests. Only Owners can purchase additional credits." |
| Pentest statuses list 5 values | `ScanStatus` enum (`packages/shared-utils/src/status-mapper.ts:2-15`) has: `pending, running, completed, failed, stopped, cancelled, skipped, pending_verification, pending_triage, draft, estimating, estimated`. | Add missing: `Pending`, `Estimating`, `Estimated`, `Pending verification`, `Pending triage`, `Stopped`, `Skipped`. |
| Wizard: "repo → target URLs → access instructions → coverage plan → review → checkout" | Real steps (`apps/frontend/app/components/app/pentest/wizard/steps.ts`): repository, target, access, context-documents, cost-estimation, review, checkout. | Replace "coverage plan" with "context documents (optional)" + "cost estimation". |

**Missing:**
- Context documents (`apps/iva/src/context-documents/`).
- Cost estimation step inside the wizard.
- Pentest retry mode (`container.vue:5,16,38-43`).
- Disclosed pentests endpoint (`GET /scans/disclosed/:task_id`, public, no auth).

---

### `api-reference/introduction.mdx`

**Status:** ⚠️ Partially outdated.

| Claim | Reality | Fix |
| --- | --- | --- |
| Swagger UI at `/docs` | Public path is `/api-docs` (`apps/iva/src/main.ts:153` — `SwaggerModule.setup('api-docs', ...)`). `/docs` is basic-auth gated internal (`main.ts:103-114`). | Change link to `/api-docs`. |
| Base URL `https://api.hacktron.ai/v1` | Confirmed (`apps/iva/src/main.ts:121-148`). ✅ | Keep. |

**Missing:** API keys carry `effective_role: viewer` (`apps/iva/src/api-keys/api-key.entity.ts:50`). State this up-front so consumers don't expect Admin/Owner-gated routes to work.

---

### `api-reference/authentication.mdx`

**Status:** ⚠️ Partially outdated.

- **Key prefix "first 12 characters" stored non-secret.** Confirmed (`api-key.service.ts:51`). ✅
- **"Max 10 active API keys."** Confirmed (`api-key.service.ts:13`). ✅
- **Key example length.** Format is `hacktron_` + 40 chars = 49 total (`api-key.service.ts:15`). Example is open-ended; show the exact length.
- **Auth via `X-Api-Key` header.** Confirmed (`api-key-throttler.guard.ts:34`; `main.ts:131`). ✅
- **Missing:** State that `effective_role: viewer` means the key cannot escalate to Admin/Owner endpoints.
- **Missing:** Note `last_used_at` updates are fire-and-forget (`api-key.service.ts:123-127`); dashboard view can be a few seconds stale.

---

### `api-reference/rate-limits.mdx`

**Status:** ❌ Outdated.

| Claim | Reality | Fix |
| --- | --- | --- |
| "100 requests per 60 seconds" only | Three named throttlers run concurrently: `short` = 10/s, `medium` = 20/10s, `long` = 100/min (`apps/iva/src/config/throttler.config.ts:10-19`). | Document all three. |
| "Dashboard sessions do not count" | They use a separate tracker but the same numeric limits (`api-key-throttler.guard.ts:22-30`). | Rewrite: "API key requests are tracked by SHA-256 of the key; dashboard requests use a separate per-user/IP tracker but the same numeric limits." |
| Per-route limits not mentioned | `POST /v1/scans`: 2/s, 5/10s, 20/min (`throttler.config.ts:22-26`). `POST /v1/cost-estimations`: 5/10min (`throttler.config.ts:32-36`). Plus org-level "max 3 active estimations" → 429 (`cost-estimation.service.ts:1211-1216`). | Add a "Tighter limits" subsection. |

**Missing:** Mention `Retry-After` header behavior (verify whether NestJS throttler emits one).

---

### `api-reference/pagination-filtering.mdx`

**Status:** ⚠️ Mostly accurate.

- Default `limit = 15`, max `100`. Confirmed (`apps/iva/src/dto/pagination.dto.ts:14-24`). ✅
- Cost estimations: default `50`, max `100`. Confirmed (`rest-cost-estimation.controller.ts:73-79`). ✅
- Sort defaults to `DESC`. Confirmed. ✅
- **Add:** Severity sort is inverted relative to the DB enum order — `ASC` orders least → most severe (`rest-finding.controller.ts:97-110`).
- **Add:** Findings `state` filter (already exists; listed by name but missing from the "Enum filters" examples).
- **Add:** `scan_type` filter on `GET /scans` (`pr` or `full`).

---

### `api-reference/errors.mdx`

**Status:** ⚠️ Mostly accurate.

- `402` for insufficient pentest credits. Confirmed (`rest-scan.controller.ts:108-126`). ✅
- `409` for max API keys. Confirmed (`api-key.service.ts:38-42`). ✅
- Scope guard messages. Confirmed exact strings (`api-key-scope.guard.ts:59-83`). ✅
- **Add:** Custom 429 body shape for cost-estimation org cap: `"Too many active estimations (${stillActive}). Wait for current ones to finish."` (`cost-estimation.service.ts:1212-1215`).
- **Add:** Example validation-error body for malformed UUID path param (`ParseUUIDPipe` shape).

---

### `api-reference/cost-estimations/*.mdx`

**Status:** ❌ Outdated — schema mismatch on `github_installation_id`.

**create-cost-estimation.mdx:**
| Claim | Reality | Fix |
| --- | --- | --- |
| `github_installation_id` "No" (optional) for `connected` repos | REQUIRED — DTO at `apps/iva/src/cost-estimation/cost-estimation.dto.ts:51-54` has `@ApiProperty`, `@IsInt`, no `@IsOptional()`. | Mark Required. Provide an example value. |
| `repo_url` "Max 500 chars" | Confirmed (`cost-estimation.dto.ts:43`). ✅ | Keep. |
| `1–20 repositories` | Confirmed (`cost-estimation.dto.ts:27`). ✅ | Keep. |
| Response example missing fields | `RepoInputResponseDto` also includes `source` and `archive_id`. | Add to example or note "internal fields omitted". |

**list-cost-estimations.mdx** and **get-cost-estimation.mdx**: ✅ accurate per spot-check.

---

### `api-reference/scans/*.mdx`

**Status:** ⚠️ Partially outdated.

**create-scan.mdx:** Mostly accurate. Add: each entry in `target_urls` must be a valid URL (`@IsUrl({}, { each: true })` at `rest-scan.dto.ts:164-167`).

**list-scans.mdx:** Add missing statuses (`estimating`, `estimated`, `pending`, `stopped`, `skipped`, `pending_verification`, `pending_triage`, `draft`). Split `stopped/cancelled` into two rows.

**export-scan-findings.mdx:** Enumerate CSV columns (`apps/iva/src/rest/services/rest-export.service.ts:63-77`). Add SARIF `affected_file` format note: can be `path`, `path:line`, or `path:start-end`.

---

### `api-reference/findings/*.mdx`

**Status:** ❌ Outdated — invented fields.

**list-findings.mdx and get-finding.mdx:** Remove `impact`, `root_cause`, `remediation` from the response shape entirely. They do not exist on the `Finding` entity (`apps/iva/src/findings/finding.entity.ts:40-80`), are not returned by `RestExportService.toFindingResponse` (`apps/iva/src/rest/services/rest-export.service.ts:176-192`), and are not in `RestFindingResponseDto` (`rest-finding.dto.ts:42-86`).

**get-finding.mdx:** Triage entry `username` is `@ApiPropertyOptional` (`rest-finding.dto.ts:101-102`); mark optional in docs or make DTO required if guaranteed.

**add-finding-comment.mdx:** ✅ accurate.

---

### `security.mdx`, `privacy.mdx`

**Status:** ⚠️ Light review.

- `privacy.mdx` line 3: stray opening quote in frontmatter description. Fix.
- "SOC 2 Type 1" — verify with security team whether org has moved to Type 2.
- Two different security contact emails across pages — pick one canonical (`hello@hacktron.ai` vs `founders@hacktron.ai`).
- Both are short; consider adding "Last reviewed: YYYY-MM-DD".

---

### `docs.json`

**Status:** ✅ Accurate.

- Every referenced page exists on disk.
- `.worktrees/` is a worktree artifact; consider gitignoring `.worktrees/` so Mintlify never crawls it.
- Navigation order is logical (estimate → scan → findings).
- The new Billing group added on this branch slots under the Platform tab (see this branch's `docs.json` diff).

---

## Confidence notes

- **Owner-only pentest starts (#4):** If product intent is owner-only, the **code is missing a guard at `scan.controller.ts:222`** — the docs reflect intent, the code doesn't. Flag for product + eng alignment before fixing the docs.
- **SOC 2 Type 2 status:** Unverified from code alone; needs SME confirmation.
- **Hall of Fame / VDP status:** Unverified from code alone.

## Followup PR sketch

A separate PR fixing all of the above would touch:

- `index.mdx` (typo)
- `platform/quickstart.mdx` (full rewrite of onboarding flow)
- `platform/code-reviews.mdx` (add GitLab/Bitbucket sections)
- `platform/billing-access.mdx` (roles table, trial cap, pentest privilege, coupons, add spillover link)
- `platform/pentests.mdx` (wizard steps, statuses, retries, context docs)
- `api-reference/introduction.mdx` and `authentication.mdx` (Swagger URL, effective_role)
- `api-reference/rate-limits.mdx` (three throttlers + per-route + org cap)
- `api-reference/errors.mdx` (custom 429 shapes)
- `api-reference/pagination-filtering.mdx` (severity sort, scan_type)
- `api-reference/cost-estimations/create-cost-estimation.mdx` (github_installation_id required)
- `api-reference/scans/list-scans.mdx`, `export-scan-findings.mdx` (missing statuses, CSV columns, SARIF format)
- `api-reference/findings/list-findings.mdx`, `get-finding.mdx` (remove invented fields)
- `privacy.mdx` (frontmatter typo)
- `.gitignore` (add `.worktrees/`)

Estimated effort: 1–2 dev-days. None of these are large rewrites; they are surgical text edits with citations.
