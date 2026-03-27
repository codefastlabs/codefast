# Reference: APIs and report shape

## Lighthouse JSON (CLI output)

- **Category scores**: `categories.performance.score` (and `accessibility`, `best-practices`, `seo` if not filtered). Values are **0–1**; multiply by **100** for a 0–100 score. This skill targets **100** on **mobile and desktop**.
- **Audits**: `audits.<id>.score` — `null` or below **1** usually means opportunity or failure; use `title`, `description`, and `details` for next steps.

## Round-based reports (this repo)

| Item | Value |
|------|--------|
| **Root** | `.cursor/pagespeed-reports/` (from repository root) |
| **Per round** | `round-01/`, `round-02/`, … each with `lighthouse-mobile.json` and `lighthouse-desktop.json` |
| **Session start** | Clear the root directory (see [examples.md](examples.md)) so previous runs are not confused with the current session |

## PageSpeed Insights API

- **Endpoint**: `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
- **Query**: `url` (required), `key` (API key), `strategy` (`mobile` | `desktop`), `category` (repeatable: `performance`, `accessibility`, `best-practices`, `seo`).
- **Response**: `lighthouseResult` mirrors Lighthouse JSON for categories and audits.

**Public URLs only**: PSI runs on Google’s infrastructure. **Localhost** needs a tunnel (e.g. ngrok, Cloudflare Tunnel) or use **Lighthouse CLI** locally.

**Quotas**: Google documents daily limits; avoid tight loops against PSI. Prefer Lighthouse CLI for local iteration to save quota.

**Docs**: [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
