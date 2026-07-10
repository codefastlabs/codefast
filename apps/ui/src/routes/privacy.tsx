import { createFileRoute } from "@tanstack/react-router";

import { PrivacyChoices } from "#/features/privacy/components/privacy-choices";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/privacy")({
  // Effective in dev and any live render; once prerendered, `routeRules` in vite.config.ts applies instead.
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
  head: () => {
    const seo = canonicalHead("/privacy");

    return {
      meta: [
        { title: "Privacy — codefast/ui" },
        {
          name: "description",
          content: "What this site tracks, the consent model per region, and how to change your choice.",
        },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16 pb-32">
      <h1 className="mb-2 text-3xl font-semibold text-ui-fg">Privacy policy</h1>
      <p className="mb-12 text-sm text-ui-muted">
        This site is a documentation and showcase site for <code>@codefast/ui</code>. It runs no ads, sells no data, and
        collects nothing beyond the analytics described below.
      </p>

      <section aria-labelledby="privacy-collect" className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-ui-fg" id="privacy-collect">
          What we collect
        </h2>
        <ul className="flex list-disc flex-col gap-2 ps-5 text-sm leading-6 text-ui-muted">
          <li>
            <strong className="font-medium text-ui-fg">Google Analytics 4</strong> — page views and a few interaction
            events (copying an install command, searching the docs). Events carry identifiers and metadata only, never
            the copied content or free-form text. GA4 runs only with your analytics consent.
          </li>
          <li>
            <strong className="font-medium text-ui-fg">Vercel Analytics</strong> — cookieless, aggregated page-view and
            interaction counts plus web vitals; it receives no identifier and runs independently of the consent choice
            below.
          </li>
        </ul>
      </section>

      <section aria-labelledby="privacy-consent" className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-ui-fg" id="privacy-consent">
          Consent by region
        </h2>
        <ul className="flex list-disc flex-col gap-2 ps-5 text-sm leading-6 text-ui-muted">
          <li>
            <strong className="font-medium text-ui-fg">EU &amp; Vietnam (opt-in)</strong> — nothing non-essential runs
            until you accept the consent banner. After deciding, the &ldquo;Cookie settings&rdquo; link in the footer
            reopens the choice at any time.
          </li>
          <li>
            <strong className="font-medium text-ui-fg">US &amp; elsewhere (opt-out)</strong> — analytics runs by
            default; the &ldquo;Turn off analytics&rdquo; link in the footer or the switch below turns it off. This site
            never sells or shares personal information and runs no ads, so a{" "}
            <a
              className="text-ui-fg underline underline-offset-4 hover:text-ui-brand"
              href="https://globalprivacycontrol.org"
              rel="noreferrer"
              target="_blank"
            >
              Global Privacy Control
            </a>{" "}
            signal has nothing here to opt you out of — its status still shows under &ldquo;Your privacy choices&rdquo;
            below, and the ads consent signals stay denied everywhere.
          </li>
        </ul>
      </section>

      <section aria-labelledby="privacy-storage" className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-ui-fg" id="privacy-storage">
          What we store in your browser
        </h2>
        <ul className="flex list-disc flex-col gap-2 ps-5 text-sm leading-6 text-ui-muted">
          <li>
            <code>codefast-ui-consent</code> (localStorage) — your consent choice, the policy version it was given
            under, and when.
          </li>
          <li>
            <code>codefast-ui-anon-id</code> (cookie, 1 year) — a random identifier used to correlate analytics events;
            created only once analytics is permitted, removed when you opt out, and mapped to no account or personal
            profile.
          </li>
          <li>
            <code>codefast-ui-region</code> (sessionStorage, cleared when the tab closes) — the consent default resolved
            for your region, so it is looked up once per session instead of on every page.
          </li>
          <li>
            Google&rsquo;s <code>_ga</code> cookies — set only after analytics consent is granted, removed when you
            withdraw it.
          </li>
        </ul>
      </section>

      <section aria-labelledby="privacy-choices" className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-ui-fg" id="privacy-choices">
          Your privacy choices
        </h2>
        <PrivacyChoices />
      </section>

      <section aria-labelledby="privacy-contact">
        <h2 className="mb-3 text-xl font-semibold text-ui-fg" id="privacy-contact">
          Questions
        </h2>
        <p className="text-sm leading-6 text-ui-muted">
          Open an issue on{" "}
          <a
            className="text-ui-fg underline underline-offset-4 hover:text-ui-brand"
            href="https://github.com/codefastlabs/codefast/issues"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>{" "}
          for anything privacy-related, including deletion requests for your anonymous identifier.
        </p>
      </section>
    </main>
  );
}
