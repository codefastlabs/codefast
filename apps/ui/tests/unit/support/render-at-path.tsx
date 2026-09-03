import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";

/** Renders `ui` under a router sitting at `path`, so every `<Link>` resolves its href and current state as in the app. */
export async function renderAtPath(path: string, ui: ReactNode): Promise<RenderResult> {
  const routeTree = createRootRoute({ component: () => ui });
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) });

  await router.load();

  return render(<RouterProvider router={router} />);
}
