import { describe, expect, it } from "vitest";

import { COMPONENTS } from "#/registry/components";
import { DEMO_BY_SLUG } from "#/registry/demos";
import { DOC_SLUGS, loadDoc } from "#/registry/docs";
import { EXAMPLE_COMPONENT_BY_REF } from "#/registry/examples";
import { docDemo } from "#/registry/source";

/**
 * These tests walk the whole demo/doc registry and exercise the real load
 * pipeline — `import.meta.glob` discovery, dynamic `import()` of every doc
 * module (and the example components it statically pulls in), Shiki highlighting
 * (`?shiki`), and that every example's `source` ref resolves to a registered
 * live component in `EXAMPLE_COMPONENT_BY_REF`. That wires many modules together
 * with real I/O, so they live in `tests/integration/**` (each takes seconds),
 * not alongside the synchronous metadata unit tests.
 */
describe("demo registry ↔ metadata", () => {
  it("gives every demo a renderable component and a highlighted source", async () => {
    for (const [slug, entry] of DEMO_BY_SLUG) {
      expect(EXAMPLE_COMPONENT_BY_REF.has(docDemo(slug)), `${slug} Demo registered`).toBe(true);

      const source = await entry.loadSource();
      expect(source.code.length, `${slug} code`).toBeGreaterThan(0);
      expect(source.htmlDark, `${slug} htmlDark`).toContain("shiki");
      expect(source.htmlLight, `${slug} htmlLight`).toContain("shiki");
    }
    // Highlights every demo source via Shiki — real I/O, slow on a cold transform.
  }, 30_000);
});

describe("doc registry ↔ metadata", () => {
  it("returns undefined for components without a doc", async () => {
    await expect(loadDoc("not-a-component")).resolves.toBeUndefined();
  });

  it("resolves every doc to renderable examples with highlighted sources", async () => {
    for (const slug of DOC_SLUGS) {
      const doc = await loadDoc(slug);

      expect(doc, `${slug} doc`).toBeDefined();
      expect(doc?.examples.length, `${slug} examples`).toBeGreaterThan(0);

      for (const example of doc?.examples ?? []) {
        expect(EXAMPLE_COMPONENT_BY_REF.has(example.source), `${slug}/${example.id} Demo registered`).toBe(true);
        expect(example.code.length, `${slug}/${example.id} code`).toBeGreaterThan(0);
        expect(example.htmlDark, `${slug}/${example.id} htmlDark`).toContain("shiki");
        expect(example.htmlLight, `${slug}/${example.id} htmlLight`).toContain("shiki");
      }
    }
    // Loads + highlights every example of every doc — real I/O, slow on a cold transform.
  }, 30_000);

  it("uses unique example ids within each doc", async () => {
    for (const slug of DOC_SLUGS) {
      const doc = await loadDoc(slug);
      const ids = doc?.examples.map((example) => example.id) ?? [];
      expect(new Set(ids).size, `${slug} example ids`).toBe(ids.length);
    }
  }, 30_000);

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
  }, 30_000);
});
