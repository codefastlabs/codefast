/**
 * Single source of truth for the site's navigation, shared by the header, the
 * footer, and the ⌘K command palette. Add or rename a route here and every
 * navigation surface updates at once.
 */
import { linkOptions } from "@tanstack/react-router";

/**
 * Primary in-app routes. Built with `linkOptions` so every `to` is validated
 * against the router's route tree at definition time — a typo'd path fails to
 * type-check here, not at the `<Link>` call site. Each entry is a ready-to-spread
 * link option (carrying the extra `label` for display).
 */
export const PRIMARY_NAV = linkOptions([
  { to: "/", label: "Home" },
  { to: "/docs", label: "Packages" },
]);

/**
 * The `@codefast/ui` section's pages — a "UI" group in the header, listed after the primary pages
 * everywhere else.
 */
export const UI_NAV = linkOptions([
  { to: "/ui", label: "Overview" },
  { to: "/ui/components", label: "Components" },
  { to: "/ui/about", label: "Getting Started" },
]);

/** Every navigable page in display order — footer and command palette. */
export const ALL_NAV = [...PRIMARY_NAV, ...UI_NAV] as const;

type NavLink = (typeof ALL_NAV)[number];
/** Union of the valid page paths, e.g. `"/" | "/docs" | "/ui" | "/ui/components" | "/ui/about"`. */
export type PrimaryNavPath = NavLink["to"];

/** Canonical GitHub repository URL — reused by the header and footer. */
export const GITHUB_URL = "https://github.com/codefastlabs/codefast";

/** External resource links shown in the footer. */
export const RESOURCE_LINKS = [
  { href: GITHUB_URL, label: "GitHub", destination: "github" },
  { href: `${GITHUB_URL}/issues`, label: "Issues", destination: "github-issues" },
  { href: "https://www.npmjs.com/org/codefast", label: "npm", destination: "npm" },
] as const;
