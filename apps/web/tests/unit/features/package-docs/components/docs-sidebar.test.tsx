import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DocsSidebar } from "#/features/package-docs/components/docs-sidebar";
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";
import { renderAtPath } from "#/tests/unit/support/render-at-path";

const PACKAGES: ReadonlyArray<PackageSummary> = [
  {
    slug: "di",
    name: "@codefast/di",
    description: "Dependency injection",
    version: "1.0.0",
    license: "MIT",
    docs: [
      { kind: "readme", pages: [] },
      { kind: "spec", pages: [] },
    ],
  },
  {
    slug: "tracking",
    name: "@codefast/tracking",
    description: "Event tracking",
    version: "1.0.0",
    license: "MIT",
    docs: [
      { kind: "readme", pages: [] },
      { kind: "spec", pages: ["spec-consent", "spec-events"] },
      { kind: "architecture", pages: [] },
    ],
  },
];

/** Every link in the packages nav carrying `aria-current`, after rendering the sidebar at `path`. */
async function renderCurrentLinks(path: string, activeDoc: DocRef): Promise<Array<HTMLElement>> {
  await renderAtPath(path, <DocsSidebar packages={PACKAGES} activePkg="tracking" activeDoc={activeDoc} />);

  const nav = screen.getByRole("navigation", { name: "Packages" });

  return within(nav)
    .getAllByRole("link")
    .filter((link) => link.hasAttribute("aria-current"));
}

afterEach(() => {
  cleanup();
});

describe("DocsSidebar", () => {
  it("marks only the page being read as current, not the kind or package above it", async () => {
    const current = await renderCurrentLinks("/docs/tracking/spec/spec-consent", {
      kind: "spec",
      page: "spec-consent",
    });

    expect(current.map((link) => link.textContent)).toEqual(["spec-consent"]);
    expect(current[0]).toHaveAttribute("aria-current", "page");
  });

  it("marks only the kind's link current on the kind's own page", async () => {
    const current = await renderCurrentLinks("/docs/tracking/spec", { kind: "spec" });

    expect(current.map((link) => link.textContent)).toEqual(["Specification"]);
  });

  it("marks only the package link current on its README", async () => {
    const current = await renderCurrentLinks("/docs/tracking", { kind: "readme" });

    expect(current.map((link) => link.textContent)).toEqual(["@codefast/tracking"]);
  });

  it("unfolds a directory kind's pages only while it or one of them is read", async () => {
    await renderCurrentLinks("/docs/tracking", { kind: "readme" });

    expect(screen.queryByRole("link", { name: "spec-events" })).not.toBeInTheDocument();

    cleanup();
    await renderCurrentLinks("/docs/tracking/spec/spec-consent", { kind: "spec", page: "spec-consent" });

    expect(screen.getByRole("link", { name: "spec-events" })).toHaveAttribute(
      "href",
      "/docs/tracking/spec/spec-events",
    );
  });
});
