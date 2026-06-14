import { describe, expect, it } from "vitest";

import { CATEGORIES, COMPONENT_BY_SLUG, COMPONENTS, NEIGHBORS_BY_SLUG, componentPath } from "#/registry/components";
import { DEMO_BY_SLUG } from "#/registry/demos";
import { DOC_SLUGS, loadDoc } from "#/registry/docs";

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

describe("metadata registry", () => {
  it("discovers components from meta files", () => {
    expect(COMPONENTS.length).toBeGreaterThan(0);
  });

  it("uses kebab-case slugs", () => {
    for (const { slug } of COMPONENTS) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("sorts components A–Z by name", () => {
    const names = COMPONENTS.map((component) => component.name);
    const sorted = [...names].toSorted((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it("assigns every component to a known category", () => {
    for (const { category } of COMPONENTS) {
      expect(CATEGORY_IDS.has(category)).toBe(true);
    }
  });

  it("builds the @codefast/ui import path from the slug", () => {
    expect(componentPath("alert-dialog")).toBe("@codefast/ui/alert-dialog");
  });

  it("indexes every component in COMPONENT_BY_SLUG", () => {
    expect(COMPONENT_BY_SLUG.size).toBe(COMPONENTS.length);

    for (const component of COMPONENTS) {
      expect(COMPONENT_BY_SLUG.get(component.slug)).toBe(component);
    }
  });

  it("links NEIGHBORS_BY_SLUG into the exact display order", () => {
    expect(NEIGHBORS_BY_SLUG.size).toBe(COMPONENTS.length);

    COMPONENTS.forEach((component, index) => {
      const neighbors = NEIGHBORS_BY_SLUG.get(component.slug);
      expect(neighbors?.previous).toBe(COMPONENTS[index - 1]);
      expect(neighbors?.next).toBe(COMPONENTS[index + 1]);
    });
  });

  it("uses a known status when one is set", () => {
    const allowed = new Set(["stable", "beta", "deprecated"]);
    const invalid = COMPONENTS.filter(
      (component) => component.status !== undefined && !allowed.has(component.status),
    ).map((component) => component.slug);

    expect(invalid).toEqual([]);
  });
});

describe("demo registry ↔ metadata", () => {
  it("has no demo file without a matching meta file", () => {
    const slugs = new Set(COMPONENTS.map((c) => c.slug));
    const orphans = [...DEMO_BY_SLUG.keys()].filter((slug) => !slugs.has(slug));
    expect(orphans).toEqual([]);
  });

  it("gives every demo a renderable component and a highlighted source", async () => {
    for (const [slug, entry] of DEMO_BY_SLUG) {
      const Demo = await entry.load();
      expect(typeof Demo, `${slug} Demo`).toBe("function");

      const source = await entry.loadSource();
      expect(source.code.length, `${slug} code`).toBeGreaterThan(0);
      expect(source.html, `${slug} html`).toContain("shiki");
    }
  });
});

describe("doc registry ↔ metadata", () => {
  it("has no doc file without a matching meta file", () => {
    const slugs = new Set(COMPONENTS.map((c) => c.slug));
    const orphans = [...DOC_SLUGS].filter((slug) => !slugs.has(slug));
    expect(orphans).toEqual([]);
  });

  it("returns undefined for components without a doc", async () => {
    await expect(loadDoc("not-a-component")).resolves.toBeUndefined();
  });

  it("resolves every doc to renderable examples with highlighted sources", async () => {
    for (const slug of DOC_SLUGS) {
      const doc = await loadDoc(slug);

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
      const doc = await loadDoc(slug);
      const ids = doc?.examples.map((example) => example.id) ?? [];
      expect(new Set(ids).size, `${slug} example ids`).toBe(ids.length);
    }
  });

  it("only cross-links to components that exist", async () => {
    const slugs = new Set(COMPONENTS.map((c) => c.slug));
    const broken: Array<string> = [];

    for (const slug of DOC_SLUGS) {
      const doc = await loadDoc(slug);

      for (const related of doc?.related ?? []) {
        if (!slugs.has(related)) {
          broken.push(`${slug} → ${related}`);
        }
      }
    }

    expect(broken).toEqual([]);
  });
});
