import { assertValidEventProperties } from "@codefast/tracking";
import { describe, expect, it } from "vitest";

import { catalog } from "#/features/tracking/lib/tracking";

describe("apps/ui tracking catalog", () => {
  it("accepts search_query metadata without free-form query text", () => {
    const properties = { queryLength: 4 };

    expect(() => {
      assertValidEventProperties(catalog.search_query.schema, "search_query", properties);
    }).not.toThrow();

    expect(properties).not.toHaveProperty("query");
  });

  it("accepts select_search_result for a page destination", () => {
    expect(() => {
      assertValidEventProperties(catalog.select_search_result.schema, "select_search_result", {
        resultType: "page",
        destination: "/components",
        hadQuery: true,
      });
    }).not.toThrow();
  });

  it("accepts select_search_result for a component selection", () => {
    expect(() => {
      assertValidEventProperties(catalog.select_search_result.schema, "select_search_result", {
        resultType: "component",
        slug: "button",
        hadQuery: false,
        hasDemo: true,
      });
    }).not.toThrow();
  });

  it("accepts copy_page, select_component, and open_external metadata-only payloads", () => {
    expect(() => {
      assertValidEventProperties(catalog.copy_page.schema, "copy_page", {
        slug: "button",
        variant: "markdown",
      });
    }).not.toThrow();

    expect(() => {
      assertValidEventProperties(catalog.select_component.schema, "select_component", {
        slug: "button",
        surface: "gallery-card",
      });
    }).not.toThrow();

    expect(() => {
      assertValidEventProperties(catalog.open_external.schema, "open_external", {
        destination: "chatgpt",
        surface: "copy-page-menu",
        slug: "button",
      });
    }).not.toThrow();
  });
});
