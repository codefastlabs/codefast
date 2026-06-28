import { EXAMPLE_COMPONENT_BY_REF, getLoadedExampleComponent } from "#/registry/examples";
import type { SourceRef } from "#/registry/types";

interface ExampleLiveProps {
  /** Source ref of the example whose live preview component should render. */
  readonly source: SourceRef;
}

/**
 * Renders an example's live preview component, resolved by its `source` ref.
 *
 * After a client navigation the route loader ran in the browser and captured the
 * component (`getLoadedExampleComponent`), so it renders synchronously — no
 * `React.lazy` pending cycle, hence no one-frame fallback flash. On the initial
 * SSR load the loader ran on the server, so the client cache is cold at
 * hydration; the `React.lazy` handle then lets React hydrate the
 * server-rendered preview in place without a flash (wrap in `<Suspense>`).
 */
export function ExampleLive({ source }: ExampleLiveProps) {
  const Loaded = getLoadedExampleComponent(source);

  if (Loaded) {
    return <Loaded />;
  }

  const Lazy = EXAMPLE_COMPONENT_BY_REF.get(source);

  return Lazy ? <Lazy /> : null;
}
