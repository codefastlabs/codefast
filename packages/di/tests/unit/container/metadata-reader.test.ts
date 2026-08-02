/**
 * A container is handed its `MetadataReader` when its resolver is built, so where the reader comes
 * from decides whether resolution ever sees it. `ContainerOptions.metadataReader` is the source
 * that is in place by then; the `MetadataReaderToken` binding is not, and these cases pin both
 * halves of that so the difference stops being folklore.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { MissingMetadataError } from "#/errors";
import { MetadataReaderToken } from "#/metadata/metadata-reader-token";
import type { ConstructorMetadata, LifecycleMetadata, MetadataReader } from "#/metadata/metadata-types";
import { token } from "#/token";
import type { Constructor } from "#/types";

const dsnToken = token<string>("metadata-reader.dsn");

/** Undecorated on purpose — the reader is the only thing that can describe it. */
class Pool {
  opened = false;
  closed = false;

  constructor(readonly dsn: string) {}

  open(): void {
    this.opened = true;
  }

  close(): void {
    this.closed = true;
  }
}

function tableReader(overrides?: { lifecycle?: boolean }): MetadataReader {
  return {
    getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
      return target === (Pool as Constructor)
        ? { params: [{ index: 0, token: dsnToken, optional: false, multi: false }] }
        : undefined;
    },
    getLifecycleMetadata(target: Constructor): LifecycleMetadata | undefined {
      return overrides?.lifecycle === true && target === (Pool as Constructor)
        ? { postConstruct: ["open"], preDestroy: ["close"] }
        : undefined;
    },
  };
}

describe("ContainerOptions.metadataReader", () => {
  it("resolves a class the decorator reader knows nothing about", () => {
    const container = Container.create({ metadataReader: tableReader() });

    container.bind(dsnToken).toConstantValue("postgres://localhost/app");
    container.bind(Pool).toSelf().singleton();

    expect(container.resolve(Pool).dsn).toBe("postgres://localhost/app");
  });

  it("is inherited by children, which build their own resolver", () => {
    const root = Container.create({ metadataReader: tableReader() });
    const child = root.createChild().createChild();

    child.bind(dsnToken).toConstantValue("postgres://localhost/child");
    child.bind(Pool).toSelf().singleton();

    expect(child.resolve(Pool).dsn).toBe("postgres://localhost/child");
  });

  it("drives the lifecycle hooks the reader declares", async () => {
    const container = Container.create({ metadataReader: tableReader({ lifecycle: true }) });

    container.bind(dsnToken).toConstantValue("postgres://localhost/app");
    container.bind(Pool).toSelf().singleton();

    const pool = container.resolve(Pool);

    expect(pool.opened).toBe(true);

    await container.dispose();

    expect(pool.closed).toBe(true);
  });

  it("is also what validate() and generateDependencyGraph() read", () => {
    const container = Container.create({ metadataReader: tableReader() });

    container.bind(dsnToken).toConstantValue("postgres://localhost/app");
    container.bind(Pool).toSelf().singleton();

    expect(() => {
      container.validate();
    }).not.toThrow();

    const graph = container.generateDependencyGraph();
    const poolNode = graph.nodes.find((node) => node.tokenName === "Pool");
    const dsnNode = graph.nodes.find((node) => node.tokenName === "metadata-reader.dsn");

    expect(graph.edges).toEqual([expect.objectContaining({ from: poolNode?.id, to: dsnNode?.id, optional: false })]);
  });

  it("outranks a MetadataReaderToken binding on the same container", () => {
    const container = Container.create({ metadataReader: tableReader() });

    // A reader that describes nothing: if it won, resolving Pool would throw.
    container.bind(MetadataReaderToken).toConstantValue({
      getConstructorMetadata: () => undefined,
      getLifecycleMetadata: () => undefined,
    });
    container.bind(dsnToken).toConstantValue("postgres://localhost/app");
    container.bind(Pool).toSelf().singleton();

    expect(container.resolve(Pool).dsn).toBe("postgres://localhost/app");
  });
});

describe("MetadataReaderToken binding", () => {
  it("cannot reach the resolver of the container it is bound on", () => {
    const container = Container.create();

    container.bind(MetadataReaderToken).toConstantValue(tableReader());
    container.bind(dsnToken).toConstantValue("postgres://localhost/app");
    container.bind(Pool).toSelf().singleton();

    expect(() => container.resolve(Pool)).toThrow(MissingMetadataError);
  });

  it("does not reach that container's validate() or graph either", () => {
    const container = Container.create();

    container.bind(MetadataReaderToken).toConstantValue(tableReader());
    container.bind(dsnToken).toConstantValue("postgres://localhost/app");
    container.bind(Pool).toSelf().singleton();

    // A reader is fixed when the resolver is built, so introspection cannot disagree with resolution:
    // the table's Pool params are invisible here exactly as they are to resolve().
    expect(container.generateDependencyGraph().edges).toEqual([]);
  });

  it("reaches a child, whose resolver is built after the binding exists", () => {
    const root = Container.create();

    root.bind(MetadataReaderToken).toConstantValue(tableReader());

    const child = root.createChild();

    child.bind(dsnToken).toConstantValue("postgres://localhost/child");
    child.bind(Pool).toSelf().singleton();

    expect(child.resolve(Pool).dsn).toBe("postgres://localhost/child");
  });
});
