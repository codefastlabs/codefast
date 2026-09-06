import { describe, expect, it } from "vitest";

// Every sample the home page shows, plus the demo module they all describe.
const sources = import.meta.glob<string>(
  [
    "../../../../../src/features/home/lib/*.source.ts",
    "../../../../../src/features/home/lib/*.sample.txt",
    "../../../../../src/features/home/demos/*.ts",
  ],
  { query: "?raw", import: "default", eager: true },
);

const INTERFACE = /^(?:export )?interface (\w+) \{([\s\S]*?)^\}/gm;
const TOKEN = /token<(\w+)>\("(\w+)"\)/g;

describe("home samples", () => {
  it("cover the whole cast", () => {
    expect(Object.keys(sources).length).toBeGreaterThanOrEqual(6);
  });

  it("declare each interface with one body, so a name never carries two contracts on the page", () => {
    const bodies = new Map<string, Set<string>>();

    for (const source of Object.values(sources)) {
      for (const [, name, body] of source.matchAll(INTERFACE)) {
        const normalised = (body ?? "").replaceAll(/\s+/g, " ").trim();
        const seen = bodies.get(name ?? "") ?? new Set<string>();

        seen.add(normalised);
        bodies.set(name ?? "", seen);
      }
    }

    expect(bodies.size).toBeGreaterThan(0);

    for (const [name, seen] of bodies) {
      expect(seen, `interface ${name} is declared with ${seen.size} different bodies`).toHaveProperty("size", 1);
    }
  });

  it("name every token after the type it carries", () => {
    const mismatched: Array<string> = [];

    for (const [path, source] of Object.entries(sources)) {
      for (const [, type, name] of source.matchAll(TOKEN)) {
        if (type !== name) {
          mismatched.push(`${path}: token<${type}>("${name}")`);
        }
      }
    }

    expect(mismatched).toEqual([]);
  });
});
