import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DocTabs } from "#/features/package-docs/components/doc-tabs";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";
import { renderAtPath } from "#/tests/unit/support/render-at-path";

const TRACKING: PackageSummary = {
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
};

/** Every tab carrying `aria-current`, after rendering the strip at `path`. */
async function renderCurrentTabs(path: string): Promise<Array<HTMLElement>> {
  await renderAtPath(path, <DocTabs pkg={TRACKING} />);

  const nav = screen.getByRole("navigation", { name: "@codefast/tracking documents" });

  return within(nav)
    .getAllByRole("link")
    .filter((tab) => tab.hasAttribute("aria-current"));
}

afterEach(() => {
  cleanup();
});

describe("DocTabs", () => {
  it("marks only the Overview tab current on the package's README", async () => {
    const current = await renderCurrentTabs("/docs/tracking");

    expect(current.map((tab) => tab.textContent)).toEqual(["Overview"]);
  });

  it("marks only the kind's tab current on its own page", async () => {
    const current = await renderCurrentTabs("/docs/tracking/spec");

    expect(current.map((tab) => tab.textContent)).toEqual(["Specification"]);
  });

  it("keeps the kind's tab current on a page beneath it, never the Overview tab", async () => {
    const current = await renderCurrentTabs("/docs/tracking/spec/spec-consent");

    expect(current.map((tab) => tab.textContent)).toEqual(["Specification"]);
  });

  it("renders nothing for a package with a single document", async () => {
    await renderAtPath(
      "/docs/di",
      <DocTabs pkg={{ ...TRACKING, slug: "di", docs: [{ kind: "readme", pages: [] }] }} />,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
