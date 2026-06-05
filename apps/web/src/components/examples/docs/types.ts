/**
 * Shared types for the per-component rich documentation registry.
 *
 * Each component's doc lives in its own module under `docs/<slug>/<slug>.doc.ts`
 * and is aggregated by `docs/index.ts` into `COMPONENT_DOCS`. The detail route
 * (`/components/$slug`) reads from there; components without an entry fall back
 * to the single card demo from `demos.tsx`.
 */
import type { ComponentType } from "react";
import type { KeyRow } from "#/components/docs/keyboard-table";
import type { PropRow } from "#/components/docs/props-table";

export interface DocExample {
  /** Anchor id, unique within a component page. */
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly Demo: ComponentType;
  readonly code: string;
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
  /** Composition skeleton shown verbatim in the Anatomy section. */
  readonly anatomy?: string;
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
