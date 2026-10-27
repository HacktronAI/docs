---
name: writing-docs
description: Write and review Hacktron documentation with a humanizer pass, current product screenshots, useful Mintlify components, and verified inter-page links.
---

# Writing Hacktron docs

Use this skill for new guides, documentation updates, and reviews in this repo.
Follow it alongside the user's request and the repo's contribution instructions.

## Start with the reader and the product

- Read the existing page and a nearby guide. Match their voice and level of detail.
- Identify what the reader wants to do and what they need before starting.
- Check the current product UI and source for labels, permissions, availability,
  limits, and outcomes. Keep exact button names. Ask about genuine uncertainty.
- Explain the shortest complete path through the task. Include meaningful limits
  and failure recovery. Leave implementation details out of customer guides.
- Extend the existing page when it fits. Add a page when the task deserves its own
  destination, then connect it to navigation and related guides.

## Run a humanizer pass

Use an available `humanizer` skill, such as
[blader/humanizer](https://github.com/blader/humanizer). If unavailable, apply this
equivalent editing pass. Run it on the final prose, including captions, cards,
descriptions, and callouts.

1. Read the whole draft once for meaning and flow. Mark boilerplate, repetition,
   inflated claims, and sentences a teammate would never say.
2. Rewrite around the reader's action. Use concrete verbs and ordinary words.
   Start with the useful fact or instruction. Preserve verified behavior, limits,
   safety guidance, and exact UI labels.
3. Remove staged contrasts such as "not X, but Y", "it's X, not Y", and their
   two-sentence equivalents. State the fact directly. Keep factual restrictions
   when the reader needs them.
4. Replace prose semicolons and em dashes with natural sentences. Leave syntax in
   code, URLs, and literal UI labels alone.
5. Cut announcements like "let's dive in", sales language like "seamlessly
   leverage", forced groups of three, and closers that repeat the preceding point.
   Avoid repetitive sentence templates and unnecessary bold text.
6. Read the rewrite aloud. Check that it sounds like a helpful colleague and that
   no behavior, promise, or example was invented while making it sound smoother.

Do not turn a technical guide into chatty commentary. Prefer a short, direct
explanation to either stiff prose or artificial personality.

Examples:

- "The team issues the letter; you do not create it in the dashboard." becomes
  "Contact us to request a letter."
- "Exports include all pages, not just the current page." becomes
  "The export includes matching findings across all pages."
- "Retesting checks fixes; it is not a new assessment." becomes
  "The retest covers the fixes you submitted."

## Include product screenshots

- Include screenshots in dashboard workflow guides. Capture the controls and
  states the reader needs, especially menus, configuration steps, and results.
  A screenshot of the documentation itself is review evidence, not a product
  screenshot for the guide. API-only or conceptual pages may not need an image.
- Capture the real current application. Use a dedicated test account and demo
  data. If a state is unavailable, use the actual frontend with sanitized sample
  fixtures and disclose that provenance in the PR. Never draw a replacement UI
  or present sample outcomes as a completed customer engagement.
- Exclude customer data, personal information, credentials, private source, and
  secret-bearing URLs. Do not mutate a customer's engagement to obtain a picture.
- Follow the existing screenshot style and theme. Keep labels readable at article
  width. Crop to the relevant panel when useful, retaining the original evidence.
  Avoid browser chrome, debug widgets, loading states, and accidental tooltips.
- Store assets under `images/` with descriptive names. Place each image beside
  the instruction it explains, using descriptive alt text and the existing image
  or `Frame` pattern. Reuse an image only if its UI is still current.
- If safe capture is blocked, explain the gap. Do not silently omit screenshots
  from a UI guide or substitute an unrelated image.

## Use Mintlify components with a purpose

- Use `Steps` for ordered actions. Put an optional-step `Note` at the top of the
  relevant step. Use ordinary prose for a short explanation.
- Put `Note`, `Tip`, and `Warning` beside the decision they affect. Reserve
  warnings for consequences such as public access, destructive actions, or
  one-time limits. Avoid repeating the same caveat in a callout and the prose.
- Use `Card` and `Columns` for distinct starting points or next tasks, especially
  on overview pages. Do not turn every cross-reference into a card.
- Use `Tabs` for genuine alternatives and `Accordion` for optional detail. Keep
  prerequisites and required steps visible.
- Use tables for real comparisons, statuses, and limits. Avoid tables that just
  decorate a list or repeat surrounding instructions.
- Add inter-page links where the reader needs them. Embed the link in the
  relevant sentence instead of appending a generic "see also" paragraph.
- Link to real page headings. Step titles may not create usable anchors in
  Mintlify. Check the landing position in the browser.

## Verify the finished guide

1. Recheck claims against the product, especially labels visible in screenshots.
2. Run `pnpm lint` and `pnpm exec mintlify broken-links`.
3. Preview with `pnpm exec mintlify dev --port 3000`. Follow the repo's testing
   approval and handoff rules for browser-driven checks.
4. In the browser, verify navigation, images and alt text, component rendering,
   mailto targets, cross-page links, and heading anchor landings. Check image
   legibility at article width and a narrow viewport.
5. Review the final diff for unsupported claims, filler, semicolons, contrast
   templates, missing images, and duplicate navigation. Run normal commit hooks.
6. Put browser evidence and any sample-data or untested caveat on the PR. Distinguish
   rendered-document checks from testing the product operations themselves.

The guide is ready when a reader can complete the task without guessing and the
prose, screenshots, and product describe the same workflow.
