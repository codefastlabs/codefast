/** Canonical origin of the deployed site. Used to build absolute SEO/social URLs. */
export const SITE_URL = "https://codefastlabs.com";

/** Absolute URL for `path`, for `canonical` links and `og:url` / `og:image`. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

/** Absolute URL of the social-share / structured-data image (1200×630). */
export const SITE_OG_IMAGE = absoluteUrl("/og-image.png");

/**
 * A JSON-LD `<script type="application/ld+json">` head entry. Spread the result into a
 * route's `head().scripts` so the structured data is server-rendered for crawlers.
 */
export function jsonLdScript(data: Record<string, unknown>): {
  type: "application/ld+json";
  children: string;
} {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

/**
 * Per-page `canonical` link + `og:url` meta. Each route spreads these into its
 * own `head()` so crawlers see its real URL — a single site-wide canonical would
 * wrongly point every page at the homepage.
 */
export function canonicalHead(path: string): {
  links: Array<{ rel: "canonical"; href: string }>;
  meta: Array<{ property: "og:url"; content: string }>;
} {
  const url = absoluteUrl(path);

  return {
    links: [{ rel: "canonical", href: url }],
    meta: [{ property: "og:url", content: url }],
  };
}
