/**
 * A `MetadataReader` is a public seam, so what it returns is a claim rather than a fact. Every path
 * that reads constructor metadata verifies it here, which is what keeps a reader's mistake a named
 * error at the class it described instead of a `TypeError` raised later inside a resolve — and keeps
 * `validate()` from passing a container that `resolve()` cannot survive.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import type { Constructor } from "#/core/types";
import { InvalidMetadataError } from "#/errors/errors";
import type { ConstructorMetadata, MetadataReader } from "#/metadata/metadata-types";
import { assertConstructorMetadata, verifyConstructorMetadata } from "#/resolution/cache/class-introspector";

const dsnToken = token<string>("class-introspector.dsn");

class Pool {
  constructor(readonly dsn: string) {}
}

/** A reader that answers with whatever the test hands it, however wrong. */
function readerReturning(metadata: unknown): MetadataReader {
  return {
    getConstructorMetadata: () => metadata as ConstructorMetadata | undefined,
    getLifecycleMetadata: () => undefined,
  };
}

function containerWith(metadata: unknown): Container {
  const container = Container.create({ metadataReader: readerReturning(metadata) });

  container.bind(dsnToken).toConstantValue("postgres://localhost/app");
  container.bind(Pool).toSelf().singleton();

  return container;
}

describe("assertConstructorMetadata", () => {
  it("passes undefined through — an undescribed class is MissingMetadataError's story", () => {
    expect(assertConstructorMetadata(undefined, Pool)).toBeUndefined();
  });

  it("accepts metadata a consumer can dereference", () => {
    const metadata = { params: [{ index: 0, token: dsnToken, optional: false, multi: false }] };

    expect(assertConstructorMetadata(metadata, Pool)).toBe(metadata);
  });

  it("rejects a non-object, naming the class and what was wrong", () => {
    expect(() => assertConstructorMetadata("params", Pool)).toThrow(InvalidMetadataError);

    let caught: unknown;

    try {
      assertConstructorMetadata(42, Pool);
    } catch (error) {
      caught = error;
    }

    expect((caught as InvalidMetadataError).code).toBe("INVALID_METADATA");
    expect((caught as InvalidMetadataError).targetName).toBe("Pool");
    expect((caught as InvalidMetadataError).reason).toContain("number");
  });

  it("rejects missing or non-array params", () => {
    for (const metadata of [{}, { params: undefined }, { params: "none" }]) {
      expect(() => assertConstructorMetadata(metadata, Pool)).toThrow(InvalidMetadataError);
    }
  });

  it("rejects a param entry that is not an object or carries no token", () => {
    expect(() => assertConstructorMetadata({ params: [null] }, Pool)).toThrow(InvalidMetadataError);
    expect(() => assertConstructorMetadata({ params: [{ index: 0 }] }, Pool)).toThrow(InvalidMetadataError);
    expect(() => assertConstructorMetadata({ params: [{ token: "dsn" }] }, Pool)).toThrow(InvalidMetadataError);
  });

  it("accepts a class as a param's token, not only a token object", () => {
    const metadata = { params: [{ index: 0, token: Pool as Constructor, optional: false, multi: false }] };

    expect(assertConstructorMetadata(metadata, Pool)).toBe(metadata);
  });
});

describe("a reader's mistake reaches every consumer as the same error", () => {
  it("throws on resolve rather than a TypeError from the plan compiler", () => {
    expect(() => containerWith({}).resolve(Pool)).toThrow(InvalidMetadataError);
  });

  it("throws on validate() instead of reporting a container that cannot resolve", () => {
    expect(() => {
      containerWith({}).validate();
    }).toThrow(InvalidMetadataError);
  });

  it("throws on generateDependencyGraph() rather than drawing a class with no edges", () => {
    expect(() => containerWith({}).generateDependencyGraph()).toThrow(InvalidMetadataError);
  });
});

describe("verifyConstructorMetadata", () => {
  it("verifies a (reader, class) pair once, then trusts it", () => {
    let calls = 0;
    const reader: MetadataReader = {
      getConstructorMetadata: () => {
        calls += 1;

        return { params: [{ index: 0, token: dsnToken, optional: false, multi: false }] };
      },
      getLifecycleMetadata: () => undefined,
    };

    expect(verifyConstructorMetadata(reader, Pool)?.params).toHaveLength(1);
    expect(verifyConstructorMetadata(reader, Pool)?.params).toHaveLength(1);
    // The reader is still asked every time — only the verification is remembered.
    expect(calls).toBe(2);
  });

  it("verifies each reader separately, so one reader's mistake is still caught", () => {
    const good: MetadataReader = readerReturning({ params: [] });
    const bad: MetadataReader = readerReturning({ params: "none" });

    expect(verifyConstructorMetadata(good, Pool)).toBeDefined();
    expect(() => verifyConstructorMetadata(bad, Pool)).toThrow(InvalidMetadataError);
  });
});
