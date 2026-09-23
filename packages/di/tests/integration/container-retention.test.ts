/**
 * Tokens live as long as the module that declares them, so nothing the engine hangs off a token may
 * keep a container reachable once the container is disposed, or once another container has bound the
 * same tokens in its place.
 */
import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";

setFlagsFromString("--expose-gc");
const collectGarbage = runInNewContext("gc") as () => void;

/** Module-scoped, like an application's tokens: they outlive every container in this file. */
const Config = token<{ readonly dsn: string }>("cr:Config");
const Service = token<{ readonly config: { readonly dsn: string } }>("cr:Service");
const Request = token<{ readonly id: number }>("cr:Request");

/** Whether every referent is gone after the job that created it has ended and the heap was collected. */
async function allCollected(refs: ReadonlyArray<WeakRef<object>>): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    // A WeakRef target is held until the job that dereferenced it ends, so collect on a later turn.
    await new Promise((resolve) => setTimeout(resolve, 0));
    collectGarbage();
    if (refs.every((ref) => ref.deref() === undefined)) {
      return true;
    }
  }
  return false;
}

/** A root that bound and resolved the module tokens, returned only as weak references. */
function boundRoot(): { refs: Array<WeakRef<object>>; container: Container } {
  const container = Container.create();
  container.bind(Config).toConstantValue({ dsn: "postgres://localhost/app" });
  container
    .bind(Service)
    .toResolved((config) => ({ config }), [Config])
    .singleton();
  const service = container.resolve(Service);
  return { refs: [new WeakRef(container), new WeakRef(service)], container };
}

describe("what the module-scoped tokens keep alive", () => {
  it("releases a disposed container and the singletons it built", async () => {
    const refs = await (async () => {
      const { refs: held, container } = boundRoot();
      await container.dispose();
      return held;
    })();

    expect(await allCollected(refs)).toBe(true);
  });

  it("releases a container another one has bound the same tokens in place of", async () => {
    const refs = boundRoot().refs;
    const successor = boundRoot().container;

    expect(await allCollected(refs)).toBe(true);
    expect(successor.resolve(Service).config.dsn).toBe("postgres://localhost/app");
  });

  it("releases a disposed per-request child while its parent lives on", async () => {
    const parent = Container.create();
    parent.bind(Config).toConstantValue({ dsn: "postgres://localhost/app" });
    const refs = await (async () => {
      const child = parent.createChild();
      child.bind(Request).toConstantValue({ id: 1 });
      const request = child.resolve(Request);
      const held = [new WeakRef<object>(child), new WeakRef<object>(request)];
      await child.dispose();
      return held;
    })();

    expect(await allCollected(refs)).toBe(true);
    expect(parent.resolve(Config).dsn).toBe("postgres://localhost/app");
  });
});
