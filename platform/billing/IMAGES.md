# Billing pages — screenshots to capture

Tracks every placeholder dropped in the new `platform/billing/*.mdx` pages, mapped to the actual frontend component on `hecktron/origin/main`. When you replace a placeholder, delete its row from this checklist.

**Conventions**

- Source: dark theme, ~1600×900 (matches the existing `/images/platform-*-dark.png` set).
- Format: PNG. Name follows `platform-billing-{topic}-dark.png`.
- Replace each `<img src="/images/screenshot-placeholder.svg" />` with `<img src="/images/{name}.png" />` and drop the placeholder caption text from the `<Frame>`.

## Checklist

| Page | Where | Component / route | Suggested filename |
| --- | --- | --- | --- |
| `overview.mdx` | Hero card (already populated) | `/[slug]/billing` | `platform-billing-dark.png` (existing) |
| `trial.mdx` | After "How the trial starts" | `AppBillingStartTrialModal` (`apps/frontend/app/components/app/billing/start-trial-modal.vue`) | `platform-billing-trial-modal-dark.png` |
| `trial.mdx` | Inside the "Owner ends trial early" tab | Billing sidebar with the `skipTrialAvailable` button (`apps/frontend/app/pages/[slug]/billing.vue:230-238`) | `platform-billing-end-trial-cta-dark.png` |
| `seats.mdx` | Before "A worked example" | `/[slug]/people` (or Seats tab) with seat list + cycle-peak metric | `platform-billing-seats-list-dark.png` |
| `spillover.mdx` | Before "How overage PRs are billed" | `AppBillingSpilloverCard` (`apps/frontend/app/components/app/billing/spillover-card.vue`) | `platform-billing-spillover-toggle-dark.png` |
| `spillover.mdx` | After "Developers can ask Owners directly…" | `AppOrganizationPeopleSpilloverBanner` (`apps/frontend/app/components/app/organization/people/spillover-banner.vue`), Owner view | `platform-billing-spillover-banner-dark.png` |
| `lifecycle.mdx` | Before "Reactivate during grace" | Billing sidebar in Grace state — `isCancelling` branch (`apps/frontend/app/pages/[slug]/billing.vue:200-228`) | `platform-billing-grace-period-dark.png` |
| `lifecycle.mdx` | Before "Resubscribe" | `AppBillingTrialEndedBanner` (`apps/frontend/app/components/app/billing/trial-ended-banner.vue`) | `platform-billing-trial-ended-banner-dark.png` |
| `lifecycle.mdx` | Inside "Resubscribe" section | Billing sidebar with the `canStartTrial===false` Resubscribe branch (`apps/frontend/app/pages/[slug]/billing.vue:255-263`) | `platform-billing-resubscribe-dark.png` |

## Optional shots (nice-to-have, not currently placeheld)

- A real GitHub PR with the `CAPACITY_REACHED` CI annotation for the spillover-disabled deny copy — would strengthen `spillover.mdx`. Source: `apps/iva/src/seat/dev/dev-seat-policy.service.ts:190-211` for the exact copy variants.
- The Stripe-hosted "Add payment method" modal (`AppBillingAddPaymentMethodModal`) — relevant on both `trial.mdx` and `lifecycle.mdx` for the resubscribe flow.

## Removing the placeholder

`/images/screenshot-placeholder.svg` exists only to render a visible "Screenshot pending" frame during review. Once every row above is replaced, delete:

- `images/screenshot-placeholder.svg`
- `platform/billing/IMAGES.md` (this file)
