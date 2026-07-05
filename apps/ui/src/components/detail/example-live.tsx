import { EXAMPLE_COMPONENT_BY_REF, getLoadedExampleComponent } from "#/registry/_core/examples";
import type { SourceRef } from "#/registry/_core/types";

interface ExampleLiveProps {
  /** Source ref of the example whose live preview component should render. */
  readonly source: SourceRef;
}

/**
 * Renders an example's live preview by `source` ref. After a client nav the
 * component was captured during the loader (`getLoadedExampleComponent`) → renders
 * synchronously, no fallback flash. At SSR hydration the cache is cold, so the
 * `React.lazy` handle hydrates the server-rendered preview in place (wrap in `<Suspense>`).
 */
export function ExampleLive({ source }: ExampleLiveProps) {
  const Loaded = getLoadedExampleComponent(source);

  if (Loaded) {
    return <Loaded />;
  }

  const Lazy = EXAMPLE_COMPONENT_BY_REF.get(source);

  return Lazy ? <Lazy /> : null;
}
