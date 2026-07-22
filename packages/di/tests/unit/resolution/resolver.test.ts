/**
 * Characterization tests for the resolution hot paths targeted by the
 * compiled-instantiator and parent-chain-cache optimizations. These pin the
 * observable resolve semantics (arity, scope, child shadowing, alias, activation,
 * lifecycle, cycles) so a hot-path rewrite cannot silently change behavior.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { injectAll, optional } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { postConstruct } from "#/decorators/lifecycle-decorators";
import { CircularDependencyError, MissingScopeContextError } from "#/errors";
import { token } from "#/token";

describe("class instantiation — arity 0..3 (unrolled fast path)", () => {
  it("resolves a zero-arg transient class fresh each time", () => {
    @injectable()
    class Leaf {}
    const leafToken = token<Leaf>("leaf0");
    const container = Container.create();
    container.bind(leafToken).to(Leaf).transient();

    const first = container.resolve(leafToken);
    const second = container.resolve(leafToken);
    expect(first).toBeInstanceOf(Leaf);
    expect(first).not.toBe(second);
  });

  it("injects deps positionally for arity 1, 2, and 3", () => {
    @injectable()
    class A {
      readonly tag = "a";
    }
    @injectable()
    class B {
      readonly tag = "b";
    }
    @injectable()
    class C {
      readonly tag = "c";
    }
    const aToken = token<A>("a");
    const bToken = token<B>("b");
    const cToken = token<C>("c");

    @injectable([aToken])
    class One {
      constructor(readonly a: A) {}
    }
    @injectable([aToken, bToken])
    class Two {
      constructor(
        readonly a: A,
        readonly b: B,
      ) {}
    }
    @injectable([aToken, bToken, cToken])
    class Three {
      constructor(
        readonly a: A,
        readonly b: B,
        readonly c: C,
      ) {}
    }
    const oneToken = token<One>("one");
    const twoToken = token<Two>("two");
    const threeToken = token<Three>("three");

    const container = Container.create();
    container.bind(aToken).to(A).transient();
    container.bind(bToken).to(B).transient();
    container.bind(cToken).to(C).transient();
    container.bind(oneToken).to(One).transient();
    container.bind(twoToken).to(Two).transient();
    container.bind(threeToken).to(Three).transient();

    expect(container.resolve(oneToken).a.tag).toBe("a");
    const two = container.resolve(twoToken);
    expect([two.a.tag, two.b.tag]).toEqual(["a", "b"]);
    const three = container.resolve(threeToken);
    expect([three.a.tag, three.b.tag, three.c.tag]).toEqual(["a", "b", "c"]);
  });

  it("keeps transient deps fresh per resolve", () => {
    @injectable()
    class Leaf {}
    const leafToken = token<Leaf>("leafT");
    @injectable([leafToken])
    class Svc {
      constructor(readonly leaf: Leaf) {}
    }
    const svcToken = token<Svc>("svcT");
    const container = Container.create();
    container.bind(leafToken).to(Leaf).transient();
    container.bind(svcToken).to(Svc).transient();

    const first = container.resolve(svcToken);
    const second = container.resolve(svcToken);
    expect(first).not.toBe(second);
    expect(first.leaf).not.toBe(second.leaf);
  });
});

describe("scope semantics", () => {
  it("singleton caches the same instance and shares deps", () => {
    @injectable()
    class Leaf {}
    const leafToken = token<Leaf>("sLeaf");
    @injectable([leafToken])
    class Svc {
      constructor(readonly leaf: Leaf) {}
    }
    const svcToken = token<Svc>("sSvc");
    const container = Container.create();
    container.bind(leafToken).to(Leaf).singleton();
    container.bind(svcToken).to(Svc).singleton();

    const first = container.resolve(svcToken);
    const second = container.resolve(svcToken);
    expect(first).toBe(second);
    expect(first.leaf).toBe(second.leaf);
  });

  it("scoped resolve throws on the root container", () => {
    @injectable()
    class Scoped {}
    const scopedToken = token<Scoped>("scoped");
    const container = Container.create();
    container.bind(scopedToken).to(Scoped).scoped();
    expect(() => container.resolve(scopedToken)).toThrow(MissingScopeContextError);
  });

  it("scoped resolve caches per child and differs across children", () => {
    @injectable()
    class Scoped {}
    const scopedToken = token<Scoped>("scoped2");
    const root = Container.create();
    root.bind(scopedToken).to(Scoped).scoped();

    const childA = root.createChild();
    const childB = root.createChild();
    const a1 = childA.resolve(scopedToken);
    const a2 = childA.resolve(scopedToken);
    const b1 = childB.resolve(scopedToken);
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b1);
  });
});

describe("parent-chain resolution (child-depth-2)", () => {
  it("resolves a root constant from a depth-2 grandchild", () => {
    const leafToken = token<number>("chainLeaf");
    const root = Container.create();
    root.bind(leafToken).toConstantValue(42);
    const grandchild = root.createChild().createChild();
    expect(grandchild.resolve(leafToken)).toBe(42);
    expect(grandchild.resolve(leafToken)).toBe(42);
  });

  it("child binding shadows the parent binding", () => {
    const valueToken = token<string>("shadowed");
    const root = Container.create();
    root.bind(valueToken).toConstantValue("root");
    const child = root.createChild();
    child.bind(valueToken).toConstantValue("child");

    expect(child.resolve(valueToken)).toBe("child");
    expect(root.resolve(valueToken)).toBe("root");
  });

  it("reflects a rebind on the parent after the first resolve", () => {
    const valueToken = token<string>("rebindChain");
    const root = Container.create();
    root.bind(valueToken).toConstantValue("before");
    const child = root.createChild();
    expect(child.resolve(valueToken)).toBe("before");

    root.rebind(valueToken).toConstantValue("after");
    expect(child.resolve(valueToken)).toBe("after");
  });

  it("reflects a new shadowing child binding added after the first resolve", () => {
    const valueToken = token<string>("lateShadow");
    const root = Container.create();
    root.bind(valueToken).toConstantValue("root");
    const child = root.createChild();
    expect(child.resolve(valueToken)).toBe("root");

    child.bind(valueToken).toConstantValue("child");
    expect(child.resolve(valueToken)).toBe("child");
  });
});

describe("alias redirect", () => {
  it("resolves an alias to its concrete singleton", () => {
    @injectable()
    class Concrete {
      readonly tag = "concrete";
    }
    const concreteToken = token<Concrete>("concrete");
    const abstractToken = token<Concrete>("abstract");
    const container = Container.create();
    container.bind(concreteToken).to(Concrete).singleton();
    container.bind(abstractToken).toAlias(concreteToken);

    const viaAlias = container.resolve(abstractToken);
    const viaConcrete = container.resolve(concreteToken);
    expect(viaAlias).toBe(viaConcrete);
    expect(container.resolve(abstractToken)).toBe(viaAlias);
  });

  it("follows a two-hop alias chain", () => {
    const concreteToken = token<number>("aliasConcrete");
    const midToken = token<number>("aliasMid");
    const topToken = token<number>("aliasTop");
    const container = Container.create();
    container.bind(concreteToken).toConstantValue(7);
    container.bind(midToken).toAlias(concreteToken);
    container.bind(topToken).toAlias(midToken);
    expect(container.resolve(topToken)).toBe(7);
  });
});

describe("activation & lifecycle", () => {
  it("runs a binding-level onActivation on every transient resolve", () => {
    @injectable()
    class Payload {
      activated = false;
    }
    const payloadToken = token<Payload>("actPayload");
    let calls = 0;
    const container = Container.create();
    container
      .bind(payloadToken)
      .to(Payload)
      .transient()
      .onActivation((_ctx, instance) => {
        calls += 1;
        instance.activated = true;
        return instance;
      });

    const first = container.resolve(payloadToken);
    const second = container.resolve(payloadToken);
    expect(first.activated).toBe(true);
    expect(second.activated).toBe(true);
    expect(calls).toBe(2);
  });

  it("runs a container-level onActivation hook on transient resolve", () => {
    @injectable()
    class Payload {
      activated = false;
    }
    const payloadToken = token<Payload>("ctrPayload");
    let calls = 0;
    const container = Container.create();
    container.bind(payloadToken).to(Payload).transient();
    container.onActivation<Payload>(payloadToken, (_ctx, instance) => {
      calls += 1;
      instance.activated = true;
      return instance;
    });

    expect(container.resolve(payloadToken).activated).toBe(true);
    expect(container.resolve(payloadToken).activated).toBe(true);
    expect(calls).toBe(2);
  });

  it("invokes @postConstruct after construction", () => {
    const order: Array<string> = [];
    @injectable()
    class WithHook {
      constructor() {
        order.push("ctor");
      }
      @postConstruct()
      init(): void {
        order.push("post");
      }
    }
    const hookToken = token<WithHook>("withHook");
    const container = Container.create();
    container.bind(hookToken).to(WithHook).transient();
    container.resolve(hookToken);
    expect(order).toEqual(["ctor", "post"]);
  });
});

describe("optional & multi injection", () => {
  it("injects undefined for an optional miss and the value for a hit", () => {
    const presentToken = token<string>("present");
    const absentToken = token<string>("absent");

    @injectable([optional(presentToken), optional(absentToken)])
    class Consumer {
      constructor(
        readonly present: string | undefined,
        readonly absent: string | undefined,
      ) {}
    }
    const consumerToken = token<Consumer>("optConsumer");
    const container = Container.create();
    container.bind(presentToken).toConstantValue("here");
    container.bind(consumerToken).to(Consumer).transient();

    const consumer = container.resolve(consumerToken);
    expect(consumer.present).toBe("here");
    expect(consumer.absent).toBeUndefined();
  });

  it("injects all bindings for a multi dependency", () => {
    const partToken = token<number>("part");
    @injectable([injectAll(partToken)])
    class Aggregate {
      constructor(readonly parts: Array<number>) {}
    }
    const aggregateToken = token<Aggregate>("aggregate");
    const container = Container.create();
    // Pure-predicate bindings coexist (default-slot bindings would collapse under last-wins).
    container
      .bind(partToken)
      .toConstantValue(1)
      .when(() => true);
    container
      .bind(partToken)
      .toConstantValue(2)
      .when(() => true);
    container.bind(aggregateToken).to(Aggregate).transient();

    expect(container.resolve(aggregateToken).parts).toEqual([1, 2]);
  });
});

describe("circular dependency detection", () => {
  it("throws CircularDependencyError on a 2-node cycle", () => {
    const firstToken = token<unknown>("cycleA");
    const secondToken = token<unknown>("cycleB");

    @injectable([secondToken])
    class First {
      constructor(readonly other: unknown) {}
    }
    @injectable([firstToken])
    class Second {
      constructor(readonly other: unknown) {}
    }
    const container = Container.create();
    container.bind(firstToken).to(First).transient();
    container.bind(secondToken).to(Second).transient();

    expect(() => container.resolve(firstToken)).toThrow(CircularDependencyError);
  });
});

describe("deep transient chain", () => {
  it("resolves a depth-4 transient chain with fresh nodes", () => {
    @injectable()
    class L4 {}
    const l4 = token<L4>("l4");
    @injectable([l4])
    class L3 {
      constructor(readonly next: L4) {}
    }
    const l3 = token<L3>("l3");
    @injectable([l3])
    class L2 {
      constructor(readonly next: L3) {}
    }
    const l2 = token<L2>("l2");
    @injectable([l2])
    class L1 {
      constructor(readonly next: L2) {}
    }
    const l1 = token<L1>("l1");
    const container = Container.create();
    container.bind(l4).to(L4).transient();
    container.bind(l3).to(L3).transient();
    container.bind(l2).to(L2).transient();
    container.bind(l1).to(L1).transient();

    const root = container.resolve(l1);
    expect(root.next.next.next).toBeInstanceOf(L4);
    expect(container.resolve(l1)).not.toBe(root);
  });
});
