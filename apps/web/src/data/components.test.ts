import { describe, expect, it } from "vitest";

import { DEMOS } from "#/components/examples/demos";
import { DOC_SLUGS, loadComponentDoc } from "#/components/examples/docs";
import {
  ALL_COMPONENTS,
  CATEGORIES,
  COMPONENT_BY_SLUG,
  DEMO_COMPONENTS,
  DEMO_NEIGHBORS,
  componentPath,
} from "#/data/components";

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

  it("indexes every component in COMPONENT_BY_SLUG", () => {
    expect(COMPONENT_BY_SLUG.size).toBe(ALL_COMPONENTS.length);

    for (const component of ALL_COMPONENTS) {
      expect(COMPONENT_BY_SLUG.get(component.slug)).toBe(component);
    }
  });

  it("links DEMO_NEIGHBORS into the exact DEMO_COMPONENTS order", () => {
    expect(DEMO_NEIGHBORS.size).toBe(DEMO_COMPONENTS.length);

    DEMO_COMPONENTS.forEach((component, index) => {
      const neighbors = DEMO_NEIGHBORS.get(component.slug);
      expect(neighbors?.previous).toBe(DEMO_COMPONENTS[index - 1]);
      expect(neighbors?.next).toBe(DEMO_COMPONENTS[index + 1]);
    });
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

  it("gives every demo a renderable component and a highlighted source", async () => {
    for (const [slug, entry] of Object.entries(DEMOS)) {
      const Demo = await entry.load();
      expect(typeof Demo, `${slug} Demo`).toBe("function");

      const source = await entry.loadSource();
      expect(source.code.length, `${slug} code`).toBeGreaterThan(0);
      expect(source.html, `${slug} html`).toContain("shiki");
    }
  });
});

describe("doc registry ↔ metadata", () => {
  it("keys every doc to a known component slug", () => {
    const slugs = new Set(ALL_COMPONENTS.map((c) => c.slug));
    const orphans = [...DOC_SLUGS].filter((slug) => !slugs.has(slug));
    expect(orphans).toEqual([]);
  });

  it("returns undefined for components without a doc", async () => {
    await expect(loadComponentDoc("not-a-component")).resolves.toBeUndefined();
  });

  it("resolves every doc to renderable examples with highlighted sources", async () => {
    for (const slug of DOC_SLUGS) {
      const doc = await loadComponentDoc(slug);

      expect(doc, `${slug} doc`).toBeDefined();
      expect(doc?.examples.length, `${slug} examples`).toBeGreaterThan(0);

      for (const example of doc?.examples ?? []) {
        expect(typeof example.Demo, `${slug}/${example.id} Demo`).toBe("function");
        expect(example.code.length, `${slug}/${example.id} code`).toBeGreaterThan(0);
        expect(example.html, `${slug}/${example.id} html`).toContain("shiki");
      }
    }
  });

  it("uses unique example ids within each doc", async () => {
    for (const slug of DOC_SLUGS) {
      const doc = await loadComponentDoc(slug);
      const ids = doc?.examples.map((example) => example.id) ?? [];
      expect(new Set(ids).size, `${slug} example ids`).toBe(ids.length);
    }
  });

  it("only cross-links to components that exist", async () => {
    const slugs = new Set(ALL_COMPONENTS.map((c) => c.slug));
    const broken: Array<string> = [];

    for (const slug of DOC_SLUGS) {
      const doc = await loadComponentDoc(slug);

      for (const related of doc?.related ?? []) {
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
