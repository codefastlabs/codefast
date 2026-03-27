# Examples

Run shell snippets from the **repository root** unless noted otherwise.

## Report layout

| Path | Contents |
|------|----------|
| `.cursor/pagespeed-reports/` | Root for all JSON reports |
| `.cursor/pagespeed-reports/round-01/` | First optimization round |
| `.cursor/pagespeed-reports/round-02/` | Second round, and so on |

Each round folder should contain:

- `lighthouse-mobile.json`
- `lighthouse-desktop.json`

## Session start: clear old reports

Do this **once** at the beginning of a skill run so old audits are not mixed with new ones.

```bash
chmod +x .cursor/skills/pagespeed-optimize-loop/scripts/clear-pagespeed-reports.sh
./.cursor/skills/pagespeed-optimize-loop/scripts/clear-pagespeed-reports.sh
```

Equivalent:

```bash
rm -rf .cursor/pagespeed-reports
mkdir -p .cursor/pagespeed-reports
```

Optional custom root (defaults to `.cursor/pagespeed-reports`):

```bash
./.cursor/skills/pagespeed-optimize-loop/scripts/clear-pagespeed-reports.sh path/to/custom-reports-root
```

## After each code change: run Lighthouse for a round

Increment the **round number** (`1`, `2`, `3`, …) for each **build → audit** cycle.

```bash
chmod +x .cursor/skills/pagespeed-optimize-loop/scripts/run-lighthouse.sh
./.cursor/skills/pagespeed-optimize-loop/scripts/run-lighthouse.sh http://127.0.0.1:4173/ .cursor/pagespeed-reports 1
```

Outputs:

- `.cursor/pagespeed-reports/round-01/lighthouse-desktop.json`
- `.cursor/pagespeed-reports/round-01/lighthouse-mobile.json`

## Read Performance scores from JSON (quick check)

```bash
node -e "const fs=require('fs'); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p)); console.log(Math.round(j.categories.performance.score*100));" .cursor/pagespeed-reports/round-01/lighthouse-mobile.json
```

## Lighthouse CLI (manual paths)

Adjust host, port, base path, and `round-01` to match the current round.

```bash
mkdir -p .cursor/pagespeed-reports/round-01

npx --yes lighthouse http://127.0.0.1:4173/ \
  --preset=desktop \
  --only-categories=performance \
  --output=json \
  --output-path=.cursor/pagespeed-reports/round-01/lighthouse-desktop.json \
  --chrome-flags="--headless --no-sandbox"

npx --yes lighthouse http://127.0.0.1:4173/ \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --only-categories=performance \
  --output=json \
  --output-path=.cursor/pagespeed-reports/round-01/lighthouse-mobile.json \
  --chrome-flags="--headless --no-sandbox"
```

**Scores**: `categories.performance.score` is **0–1**; multiply by **100** for display. Skill target: **100** on **both** mobile and desktop.

## PageSpeed Insights API (public URL)

Requires an API key. Example (mobile):

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com/&strategy=mobile&category=performance&key=YOUR_KEY"
```

Parse `lighthouseResult.categories` in the response. **Localhost** is not supported by PSI without a tunnel; prefer **Lighthouse CLI** locally.

## This monorepo (`@apps/docs`)

After **`vite build`**, production is served by Nitro from **`.output/`**. Use the same **`pnpm start`** entry as deployment:

```bash
pnpm --filter @apps/docs build
PORT=4173 HOST=127.0.0.1 pnpm --filter @apps/docs start
```

**Port 4173** is the convention for local Lighthouse in this repo. `pnpm start` runs `node .output/server/index.mjs`.

Confirm the server listens at **`http://127.0.0.1:4173/`** (or pass your actual `PORT` to Lighthouse).
