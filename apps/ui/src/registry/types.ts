/**
 * Shared types for the per-component rich documentation registry.
 *
 * Each component's doc lives in its own `registry/<slug>/doc.ts` module,
 * discovered by `docs.ts` and loaded on demand via `loadDoc(slug)`. The detail
 * route (`/components/$slug`) reads from there; components without an entry
 * fall back to the single card demo from `demos.ts`.
 */
import type { ComponentType } from "react";

import type { KeyRow } from "#/components/detail/keyboard-table";
import type { PropRow } from "#/components/detail/props-table";
import type { HighlightedSource } from "#/lib/highlight";

/**
 * Key of a registry source file (e.g. `./button/variants.example.tsx`), built by
 * `docSource`/`docAnatomy`. Resolved to raw text + highlighted HTML via
 * `getHighlightedSource`, so docs never embed source content.
 */
export type SourceRef = string;

export interface DocExample {
  /** Anchor id, unique within a component page. */
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly Demo: ComponentType;
  /** Ref to this example's source file — use `docSource(slug, name)`. */
  readonly source: SourceRef;
  /** Override the preview surface — alignment, min-height, padding. */
  readonly previewClassName?: string;
  /**
   * Reading direction for the preview. `"rtl"` wraps the demo in a language
   * switcher + `DirectionProvider` so it can be exercised in Arabic / Hebrew.
   * Defaults to `"ltr"`.
   */
  readonly direction?: "ltr" | "rtl";
}

export interface ApiGroup {
  /** Sub-component the props belong to, e.g. "Button". */
  readonly name: string;
  readonly description?: string;
  readonly props: ReadonlyArray<PropRow>;
}

export interface ComponentDoc {
  readonly examples: ReadonlyArray<DocExample>;
  /** Ref to the composition skeleton (`docAnatomy(slug)`), shown verbatim in Anatomy. */
  readonly anatomy?: SourceRef;
  readonly api?: ReadonlyArray<ApiGroup>;
  readonly accessibility?: {
    readonly keyboard?: ReadonlyArray<KeyRow>;
    readonly notes?: ReadonlyArray<string>;
  };
  readonly guidelines?: {
    readonly do?: ReadonlyArray<string>;
    readonly dont?: ReadonlyArray<string>;
  };
  /** Third-party packages the component is built on. */
  readonly dependencies?: ReadonlyArray<string>;
  /** Slugs of related components, rendered as chips. */
  readonly related?: ReadonlyArray<string>;
}

/* -------------------------------------------------------------------------- */
/* Resolved shapes — what the detail page consumes after the registry loads    */
/* a doc chunk and swaps every SourceRef for its highlighted content.          */
/* -------------------------------------------------------------------------- */

/**
 * A doc example as the detail-page loader ships it: serializable, so the live
 * `Demo` component is dropped (looked up client-side via `EXAMPLE_COMPONENT_BY_REF`
 * keyed by `source`), and the `source` ref is resolved to raw text + Shiki HTML.
 */
export interface ResolvedDocExample extends Omit<DocExample, "Demo">, HighlightedSource {}

/** A component doc with every source ref resolved. */
export interface ResolvedComponentDoc extends Omit<ComponentDoc, "examples" | "anatomy"> {
  readonly examples: ReadonlyArray<ResolvedDocExample>;
  readonly anatomy?: HighlightedSource | undefined;
}
