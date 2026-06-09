/** Shared types for the /components showcase. */

/** How the component grid is organised. Mirrored to the `?view` search param. */
export type ViewMode = "category" | "alphabetical";

/** Map of component slug → pre-highlighted demo source HTML. */
export type HighlightedCodes = Record<string, string>;
