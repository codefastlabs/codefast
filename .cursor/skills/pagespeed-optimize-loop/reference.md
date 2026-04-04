# Reference: APIs and report shape

## Lighthouse JSON (CLI output)

- **Category scores**: `categories.performance`, `categories.accessibility`, `categories["best-practices"]`, `categories.seo` (omit any category filtered out of the run). Values are **0–1**; multiply by **100** for display. Defaults for this skill: **Performance ≥ 90** on **mobile and desktop**; **accessibility**, **best practices**, and **SEO** each **100** on **both** (when audited).
- **Audits**: `audits.<id>.score` — `null` or below **1** usually means opportunity or failure; use `title`, `description`, and `details` for next steps.
- **Key audit IDs for Core Web Vitals**: `largest-contentful-paint`, `cumulative-layout-shift`, `interaction-to-next-paint`, `total-blocking-time`, `speed-index`, `first-contentful-paint`.

## Round-based reports (this repo)

| Item              | Value                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Root**          | `.cursor/pagespeed-reports/` (from repository root)                                                                  |
| **Per round**     | `round-01/`, `round-02/`, … each with `lighthouse-mobile.json` and `lighthouse-desktop.json`                         |
| **Session start** | Clear the root directory (see [examples.md](examples.md)) so previous runs are not confused with the current session |
| **Session end**   | Remove the root directory (see [examples.md](examples.md)) so Lighthouse JSON is not left in the workspace           |

## PageSpeed Insights API

- **Endpoint**: `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
- **Query params**: `url` (required), `key` (API key), `strategy` (`mobile` | `desktop`), `category` (repeatable: `performance`, `accessibility`, `best-practices`, `seo`).
- **Response**: `lighthouseResult` mirrors Lighthouse JSON for categories and audits.

**Public URLs only**: PSI runs on Google's infrastructure. **Localhost** needs a tunnel (e.g. ngrok, Cloudflare Tunnel) or use **Lighthouse CLI** locally.

**Quotas**: Google documents daily limits (typically 25,000 queries/day for free tier). Avoid tight loops against PSI — each loop iteration costs 2 requests (mobile + desktop). Prefer Lighthouse CLI for local iteration to preserve quota for final verification against the public URL.

**Docs**: [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)

## Chrome / Chromium dependency

Lighthouse CLI requires Chrome or Chromium. Common install paths:

| OS                  | Binary                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| Ubuntu/Debian       | `chromium-browser` or `google-chrome-stable`                                          |
| macOS               | `/Applications/Google Chrome.app` (auto-detected)                                     |
| CI (GitHub Actions) | Pre-installed; add `--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"` |
| Docker              | Install `chromium` package; set `CHROME_PATH` if needed                               |

If Lighthouse cannot find Chrome it will exit with `No usable sandbox` or `Cannot find Chrome`. Set the path explicitly:

```bash
npx lighthouse ... --chrome-path=$(which chromium-browser)
```
