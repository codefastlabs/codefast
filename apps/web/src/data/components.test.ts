import { describe, expect, it } from "vitest";

import { DEMOS } from "#/components/examples/demos";
import { COMPONENT_DOCS } from "#/components/examples/docs";
import { ALL_COMPONENTS, CATEGORIES, DEMO_COMPONENTS, componentPath } from "#/data/components";

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

describe("component registry", () => {
  it("has unique slugs", () => {
    const slugs = ALL_COMPONENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses kebab-case slugs", () => {
    for (const { slug } of ALL_COMPONENTS) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("assigns every component to a known category", () => {
    for (const { category } of ALL_COMPONENTS) {
      expect(CATEGORY_IDS.has(category)).toBe(true);
    }
  });

  it("builds the @codefast/ui import path from the slug", () => {
    expect(componentPath("alert-dialog")).toBe("@codefast/ui/alert-dialog");
  });

  it("derives DEMO_COMPONENTS as exactly the entries with hasDemo", () => {
    expect(DEMO_COMPONENTS).toEqual(ALL_COMPONENTS.filter((c) => c.hasDemo));
  });
});

describe("demo registry ↔ metadata", () => {
  it("provides a demo for every hasDemo component", () => {
    const missing = DEMO_COMPONENTS.filter((c) => !DEMOS[c.slug]).map((c) => c.slug);
    expect(missing).toEqual([]);
  });

  it("has no demo entry without a matching registry component", () => {
    const slugs = new Set(ALL_COMPONENTS.map((c) => c.slug));
    const orphans = Object.keys(DEMOS).filter((slug) => !slugs.has(slug));
    expect(orphans).toEqual([]);
  });

  it("never ships a demo for a component flagged hasDemo: false", () => {
    const flagged = ALL_COMPONENTS.filter((c) => !c.hasDemo).map((c) => c.slug);
    for (const slug of flagged) {
      expect(DEMOS[slug]).toBeUndefined();
    }
  });

  it("gives every demo a renderable component and non-empty source", () => {
    for (const [slug, entry] of Object.entries(DEMOS)) {
      expect(typeof entry.Demo, `${slug} Demo`).toBe("function");
      expect(entry.code.length, `${slug} code`).toBeGreaterThan(0);
    }
  });
});

describe("doc registry ↔ metadata", () => {
  it("keys every doc to a known component slug", () => {
    const slugs = new Set(ALL_COMPONENTS.map((c) => c.slug));
    const orphans = Object.keys(COMPONENT_DOCS).filter((slug) => !slugs.has(slug));
    expect(orphans).toEqual([]);
  });

  it("gives every doc at least one renderable example with source", () => {
    for (const [slug, doc] of Object.entries(COMPONENT_DOCS)) {
      expect(doc.examples.length, `${slug} examples`).toBeGreaterThan(0);

      for (const example of doc.examples) {
        expect(typeof example.Demo, `${slug}/${example.id} Demo`).toBe("function");
        expect(example.code.length, `${slug}/${example.id} code`).toBeGreaterThan(0);
      }
    }
  });

  it("uses unique example ids within each doc", () => {
    for (const [slug, doc] of Object.entries(COMPONENT_DOCS)) {
      const ids = doc.examples.map((example) => example.id);
      expect(new Set(ids).size, `${slug} example ids`).toBe(ids.length);
    }
  });

  it("only cross-links to components that exist", () => {
    const slugs = new Set(ALL_COMPONENTS.map((c) => c.slug));
    const broken: Array<string> = [];

    for (const [slug, doc] of Object.entries(COMPONENT_DOCS)) {
      for (const related of doc.related ?? []) {
        if (!slugs.has(related)) {
          broken.push(`${slug} → ${related}`);
        }
      }
    }

    expect(broken).toEqual([]);
  });
});

describe("component lifecycle", () => {
  it("uses a known status when one is set", () => {
    const allowed = new Set(["stable", "beta", "deprecated"]);
    const invalid = ALL_COMPONENTS.filter(
      (component) => component.status !== undefined && !allowed.has(component.status),
    ).map((component) => component.slug);

    expect(invalid).toEqual([]);
  });
});
