/**
 * A `{ name, tag }` request must select the same binding as its `{ tags: [slotName.of(n), tag] }`
 * spelling, independently of whether the name string has been interned anywhere in the process.
 */
import { describe, expect, it } from "vitest";

import { Container, slotName, tag, token } from "#index";

describe("name-plus-tag selection falls through to the scan", () => {
  it("matches a tag-only slot through the subset rule while the name is interned nowhere", () => {
    const name = "nt-fallthrough-uninterned";
    const K = token<string>("nt:K-fallthrough");
    const Region = tag<string>("nt:region-fallthrough");
    const container = Container.create();

    container.bind(K).toConstantValue("tagged").whenTagged(Region.of("eu"));

    // Nothing has minted this name, yet the request's criteria are a superset of the slot's.
    expect(slotName.peek(name)).toBeUndefined();
    expect(container.resolve(K, { name, tag: Region.of("eu") })).toBe("tagged");
    expect(container.resolveOptional(K, { name, tag: Region.of("eu") })).toBe("tagged");
    expect(container.resolveAll(K, { name, tag: Region.of("eu") })).toStrictEqual(["tagged"]);
    // The fall-through matched via subset, so the request-side name minted nothing.
    expect(slotName.peek(name)).toBeUndefined();
    // The tags[] spelling, which does mint, agrees.
    expect(container.resolve(K, { tags: [slotName.of(name), Region.of("eu")] })).toBe("tagged");
  });

  it("walks up to a parent holding the tag-only slot for an uninterned name", () => {
    const name = "nt-fallthrough-parent";
    const K = token<string>("nt:K-parent");
    const Region = tag<string>("nt:region-parent");
    const parent = Container.create();

    parent.bind(K).toConstantValue("parent-tagged").whenTagged(Region.of("eu"));
    const child = parent.createChild();

    expect(child.resolve(K, { name, tag: Region.of("eu") })).toBe("parent-tagged");
    expect(child.resolveOptional(K, { name, tag: Region.of("eu") })).toBe("parent-tagged");
    expect(child.resolveAll(K, { name, tag: Region.of("eu") })).toStrictEqual(["parent-tagged"]);
  });

  it("gives one answer regardless of an unrelated container interning the same name later", () => {
    const name = "nt-fallthrough-determinism";
    const K = token<string>("nt:K-determinism");
    const Region = tag<string>("nt:region-determinism");
    const container = Container.create();

    container.bind(K).toConstantValue("tagged").whenTagged(Region.of("eu"));

    const before = container.resolve(K, { name, tag: Region.of("eu") });
    // An unrelated container declaring the same name interns it process-wide.
    const other = Container.create();
    other.bind(token<string>("nt:other-determinism")).toConstantValue("x").whenNamed(name);
    const after = container.resolve(K, { name, tag: Region.of("eu") });

    expect(before).toBe("tagged");
    expect(after).toBe(before);
  });
});

describe("name-plus-tag selection honours predicate specificity", () => {
  it("lets a lone predicate candidate win the more-specific rule's first step either spelling", () => {
    const name = "nt-predicate-name";
    const K = token<string>("nt:K-predicate");
    const A = tag<string>("nt:A-predicate");
    const container = Container.create();

    container
      .bind(K)
      .toConstantValue("1crit+predicate")
      .whenNamed(name)
      .when(() => true);
    container.bind(K).toConstantValue("2crit").whenNamed(name).whenTagged(A.of("a"));

    const nameForm = { name, tag: A.of("a") } as const;
    const tagsForm = { tags: [slotName.of(name), A.of("a")] } as const;

    expect(container.resolve(K, nameForm)).toBe("1crit+predicate");
    expect(container.resolve(K, tagsForm)).toBe("1crit+predicate");
    expect(new Set(container.resolveAll(K, nameForm))).toStrictEqual(new Set(container.resolveAll(K, tagsForm)));
  });
});
