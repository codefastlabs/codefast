/**
 * The verifying wrapper checks every answer a foreign reader gives — lifecycle and accessor
 * metadata included — so a malformed shape is a named error at the class, not a confusing
 * downstream failure.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { InvalidMetadataError } from "#errors/errors";
import type { MetadataReader } from "#metadata/metadata-types";

class Probe {
  init(): void {}
}

function readerWith(overrides: Partial<MetadataReader>): MetadataReader {
  return {
    getConstructorMetadata: () => ({ params: [] }),
    getLifecycleMetadata: () => undefined,
    ...overrides,
  };
}

describe("verifying a foreign reader's lifecycle metadata", () => {
  it("names the malformed shape instead of iterating a string character-wise", () => {
    const reader = readerWith({
      getLifecycleMetadata: () => ({ postConstruct: "init" }) as never,
    });
    const container = Container.create({ metadataReader: reader });
    container.bind(Probe).toSelf().transient();

    expect(() => container.resolve(Probe)).toThrow(InvalidMetadataError);
    expect(() => container.resolve(Probe)).toThrow(/postConstruct is not an array/);
  });

  it("rejects a non-string method name", () => {
    const reader = readerWith({
      getLifecycleMetadata: () => ({ postConstruct: [42], preDestroy: [] }) as never,
    });
    const container = Container.create({ metadataReader: reader });
    container.bind(Probe).toSelf().transient();

    expect(() => container.resolve(Probe)).toThrow(/postConstruct\[0\] is not a string/);
  });
});

describe("verifying a foreign reader's accessor metadata", () => {
  it("rejects a non-array answer instead of trusting its length", () => {
    const reader = readerWith({
      getAccessorMetadata: () => "nope" as never,
    });
    const container = Container.create({ metadataReader: reader });
    container.bind(Probe).toSelf().transient();

    expect(() => container.resolve(Probe)).toThrow(/accessor metadata: expected an array/);
  });

  it("rejects an entry without a resolvable token", () => {
    const reader = readerWith({
      getAccessorMetadata: () => [{ key: "value", descriptor: { token: 42 } }] as never,
    });
    const container = Container.create({ metadataReader: reader });
    container.bind(Probe).toSelf().transient();

    expect(() => container.resolve(Probe)).toThrow(/descriptor\.token is not a token or a class/);
  });
});

describe("asking a foreign reader about a class", () => {
  it("asks once per class for the life of the reader, across resolves and containers", () => {
    class Counted {
      init(): void {}
    }
    const calls = { constructor: 0, lifecycle: 0, accessor: 0 };
    const reader: MetadataReader = {
      getConstructorMetadata: () => {
        calls.constructor += 1;
        return { params: [] };
      },
      getLifecycleMetadata: () => {
        calls.lifecycle += 1;
        return { postConstruct: ["init"], preDestroy: [] };
      },
      getAccessorMetadata: () => {
        calls.accessor += 1;
        return undefined;
      },
    };

    for (const container of [
      Container.create({ metadataReader: reader }),
      Container.create({ metadataReader: reader }),
    ]) {
      container.bind(Counted).toSelf().transient();
      for (let index = 0; index < 5; index += 1) {
        container.resolve(Counted);
      }
      container.createChild().resolve(Counted);
    }

    expect(calls).toStrictEqual({ constructor: 1, lifecycle: 1, accessor: 1 });
  });
});
