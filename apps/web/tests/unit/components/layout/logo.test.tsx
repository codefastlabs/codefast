import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Logo } from "#/components/layout/logo";

afterEach(() => {
  cleanup();
});

/** Mounts the logo under a router that knows the home and brand pages, so navigation can be observed. */
async function renderLogo() {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <Logo />
        <Outlet />
      </>
    ),
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <p>home</p> });
  const brandRoute = createRoute({ getParentRoute: () => rootRoute, path: "/brand", component: () => <p>brand</p> });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, brandRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

describe("Logo", () => {
  it("links to the home page", async () => {
    await renderLogo();

    expect(screen.getByRole("link", { name: /codefast labs home/i }).getAttribute("href")).toBe("/");
  });

  it("opens the brand page on right-click instead of the browser menu", async () => {
    const router = await renderLogo();
    const link = screen.getByRole("link", { name: /codefast labs home/i });

    // `fireEvent` returns false when a handler called `preventDefault`, which is what keeps the browser menu closed.
    const menuAllowed = fireEvent.contextMenu(link);

    expect(menuAllowed).toBe(false);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/brand");
    });
  });
});
