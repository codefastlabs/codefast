/**
 * Shared types for the per-component rich documentation registry.
 *
 * Each component's doc lives in its own `registry/<slug>/doc.ts` module,
 * discovered by `docs.ts` and loaded on demand via `loadDoc(slug)`. The detail
 * route (`/components/$slug`) reads from there; components without an entry
 * fall back to the single card demo from `demos.ts`.
 */
import type { ComponentType } from "react";

import type { KeyRow } from "#/features/components-catalog/components/detail/keyboard-table";
import type { PropRow } from "#/features/components-catalog/components/detail/props-table";
import type { HighlightedSource } from "#/registry/_core/highlight";

/**
 * Key of a registry source file (e.g. `../button/variants.example.tsx`), built by
 * `docSource`. Resolved to raw text + highlighted HTML via
 * `getHighlightedSources`, so docs never embed source content.
 */
export type SourceRef = string;

interface DocExample {
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

/** A node in the Anatomy tree — a part and the parts nested directly inside it. */
export interface AnatomyNode {
  /** The part's component name, e.g. "AlertDialogContent". */
  readonly name: string;
  readonly children?: ReadonlyArray<AnatomyNode>;
}

/** A titled accessibility note — renders as a labelled subsection instead of a plain bullet. */
export interface AccessibilityNote {
  readonly title: string;
  readonly description: string;
}

export interface ComponentDoc {
  readonly examples: ReadonlyArray<DocExample>;
  /** Ref to a minimal "import + compose" snippet, shown before Examples — use `docUsage(slug)`. */
  readonly usage?: SourceRef;
  /** Composition tree of the component's parts, rendered in the Anatomy section. */
  readonly anatomy?: ReadonlyArray<AnatomyNode>;
  /** Short bullet list of capabilities, shown ahead of the API reference. */
  readonly features?: ReadonlyArray<string>;
  readonly api?: ReadonlyArray<ApiGroup>;
  readonly accessibility?: {
    readonly keyboard?: ReadonlyArray<KeyRow>;
    readonly notes?: ReadonlyArray<string | AccessibilityNote>;
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

/**
 * A component doc with every source ref resolved. `anatomy` is plain data, so it
 * survives the loader boundary unchanged.
 */
export interface ResolvedComponentDoc extends Omit<ComponentDoc, "examples" | "usage"> {
  readonly examples: ReadonlyArray<ResolvedDocExample>;
  readonly usage?: HighlightedSource | undefined;
}
