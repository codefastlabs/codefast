/**
 * InversifyJS v8 — mirror scenarios in `codefast-benches.ts`.
 * Run via: `pnpm exec tsx --tsconfig tsconfig.inversify.json src/inversify-benches.ts`
 */
import "reflect-metadata";

import { Container, ContainerModule, inject, injectable } from "inversify";
import { Bench } from "tinybench";

/** Default duration (keep in sync with codefast-benches.ts). Raise locally for stabler numbers. */
const BENCH_OPTIONS = {
  time: 450,
  iterations: 800,
  warmupTime: 60,
  warmupIterations: 60,
} as const;

/** Keep numeric knobs in sync with `codefast-benches.ts`. */
const WIDE_N = 48;
const CHAIN_DEEP = 16;
const ROTATE_N = 32;
const MODULE_BINDS = 20;
const CHILD_DEPTH = 8;

const constantId = Symbol.for("bench-inv-constant");
const wideId = Symbol.for("bench-inv-wide");

@injectable()
class InvDep {}

const depId = Symbol.for("bench-inv-dep-class");
const svcId = Symbol.for("bench-inv-svc-class");

@injectable()
class InvService {
  constructor(@inject(depId) readonly dep: InvDep) {}
}

function buildConstantBench(): () => void {
  const c = new Container();
  c.bind<number>(constantId).toConstantValue(42);
  c.get(constantId);
  return () => {
    c.get(constantId);
  };
}

function buildSingletonClassBench(): () => void {
  const c = new Container();
  c.bind<InvDep>(depId).to(InvDep).inSingletonScope();
  c.bind<InvService>(svcId).to(InvService).inSingletonScope();
  c.get(svcId);
  return () => {
    c.get(svcId);
  };
}

function buildTransientClassBench(): () => void {
  const c = new Container();
  c.bind<InvDep>(depId).to(InvDep).inTransientScope();
  c.bind<InvService>(svcId).to(InvService).inTransientScope();
  return () => {
    c.get(svcId);
  };
}

function buildNamedConstantBench(): () => void {
  const c = new Container();
  c.bind<number>(wideId).toConstantValue(5).whenNamed("slot-5");
  c.bind<number>(wideId).toConstantValue(12).whenNamed("slot-12");
  c.bind<number>(wideId).toConstantValue(20).whenNamed("slot-20");
  c.get(wideId, { name: "slot-12" });
  return () => {
    c.get(wideId, { name: "slot-12" });
  };
}

const chain0 = Symbol.for("inv-chain-0");
const chain1 = Symbol.for("inv-chain-1");
const chain2 = Symbol.for("inv-chain-2");
const chain3 = Symbol.for("inv-chain-3");

function buildDynamicChain4Bench(): () => void {
  const c = new Container();
  c.bind<number>(chain0).toConstantValue(0);
  c.bind<number>(chain1)
    .toDynamicValue((ctx) => ctx.get<number>(chain0) + 1)
    .inTransientScope();
  c.bind<number>(chain2)
    .toDynamicValue((ctx) => ctx.get<number>(chain1) + 1)
    .inTransientScope();
  c.bind<number>(chain3)
    .toDynamicValue((ctx) => ctx.get<number>(chain2) + 1)
    .inTransientScope();
  c.get(chain3);
  return () => {
    c.get(chain3);
  };
}

const deepTokens = Array.from({ length: CHAIN_DEEP }, (_, i) => Symbol.for(`inv-deep-${i}`));

function buildDynamicTransientChain16Bench(): () => void {
  const c = new Container();
  c.bind<number>(deepTokens[0]!).toConstantValue(0);
  for (let i = 1; i < CHAIN_DEEP; i++) {
    const prev = deepTokens[i - 1]!;
    const cur = deepTokens[i]!;
    c.bind<number>(cur)
      .toDynamicValue((ctx) => ctx.get<number>(prev) + 1)
      .inTransientScope();
  }
  const leaf = deepTokens[CHAIN_DEEP - 1]!;
  c.get(leaf);
  return () => {
    c.get(leaf);
  };
}

const wide48Id = Symbol.for("bench-inv-wide-48");

function buildResolveAllNamed48Bench(): () => void {
  const c = new Container();
  for (let i = 0; i < WIDE_N; i++) {
    c.bind<number>(wide48Id).toConstantValue(i).whenNamed(`slot-${i}`);
  }
  c.getAll(wide48Id);
  return () => {
    c.getAll(wide48Id);
  };
}

const rotateIds = Array.from({ length: ROTATE_N }, (_, i) => Symbol.for(`bench-inv-rot-${i}`));

function buildRotateConstants32Bench(): () => void {
  const c = new Container();
  for (let i = 0; i < ROTATE_N; i++) {
    c.bind<number>(rotateIds[i]!).toConstantValue(i);
  }
  let idx = 0;
  return () => {
    void c.get<number>(rotateIds[idx]!);
    idx = (idx + 1) % ROTATE_N;
  };
}

const childLeafId = Symbol.for("bench-inv-child-leaf");

function buildChildInheritResolve8Bench(): () => void {
  const root = new Container();
  root.bind<number>(childLeafId).toConstantValue(42);
  let cur: Container = root;
  for (let d = 0; d < CHILD_DEPTH; d++) {
    cur = new Container({ parent: cur });
  }
  cur.get(childLeafId);
  return () => {
    cur.get(childLeafId);
  };
}

const modSymbols = Array.from({ length: MODULE_BINDS }, (_, i) =>
  Symbol.for(`bench-inv-mod-t-${i}`),
);

const mod20 = new ContainerModule((options) => {
  for (let i = 0; i < MODULE_BINDS; i++) {
    options.bind<number>(modSymbols[i]!).toConstantValue(i);
  }
});

function buildFromModules20Bench(): () => void {
  return () => {
    const c = new Container();
    c.load(mod20);
  };
}

const mixC = Symbol.for("bench-inv-mix-c");
const mixWide = Symbol.for("bench-inv-mix-wide");
const mixD0 = Symbol.for("bench-inv-mix-d0");
const mixD1 = Symbol.for("bench-inv-mix-d1");
const mixD2 = Symbol.for("bench-inv-mix-d2");
const mixD3 = Symbol.for("bench-inv-mix-d3");

function buildMixedResolveBurstBench(): () => void {
  const c = new Container();
  c.bind<number>(mixC).toConstantValue(1);
  c.bind<number>(mixWide).toConstantValue(10).whenNamed("a");
  c.bind<number>(mixWide).toConstantValue(20).whenNamed("b");
  c.bind<number>(mixWide).toConstantValue(30).whenNamed("c");
  c.bind<number>(mixD0).toConstantValue(0);
  c.bind<number>(mixD1)
    .toDynamicValue((ctx) => ctx.get<number>(mixD0) + 1)
    .inTransientScope();
  c.bind<number>(mixD2)
    .toDynamicValue((ctx) => ctx.get<number>(mixD1) + 1)
    .inTransientScope();
  c.bind<number>(mixD3)
    .toDynamicValue((ctx) => ctx.get<number>(mixD2) + 1)
    .inTransientScope();
  c.bind<InvDep>(depId).to(InvDep).inSingletonScope();
  c.bind<InvService>(svcId).to(InvService).inSingletonScope();

  c.get(mixC);
  c.get(mixWide, { name: "b" });
  c.get(mixD3);
  c.get(svcId);

  return () => {
    c.get(mixC);
    c.get(mixC);
    c.get(mixWide, { name: "a" });
    c.get(mixWide, { name: "b" });
    c.get(mixWide, { name: "c" });
    c.get(mixD3);
    c.get(svcId);
    c.get(svcId);
  };
}

function buildContainerCreateBench(): () => void {
  return () => {
    new Container();
  };
}

async function main(): Promise<{ id: string; hz: number; meanMs: number }[]> {
  const bench = new Bench(BENCH_OPTIONS);

  bench
    .add("constant-resolve", buildConstantBench())
    .add("singleton-class-1-dep", buildSingletonClassBench())
    .add("transient-class-1-dep", buildTransientClassBench())
    .add("named-constant-get", buildNamedConstantBench())
    .add("dynamic-chain-4", buildDynamicChain4Bench())
    .add("dynamic-transient-chain-16", buildDynamicTransientChain16Bench())
    .add("resolveall-named-48", buildResolveAllNamed48Bench())
    .add("rotate-constants-32", buildRotateConstants32Bench())
    .add("child-inherit-resolve-8", buildChildInheritResolve8Bench())
    .add("from-modules-20-bindings", buildFromModules20Bench())
    .add("mixed-resolve-burst", buildMixedResolveBurstBench())
    .add("container-create-empty", buildContainerCreateBench());

  await bench.run();

  return bench.tasks.map((t) => {
    const r = t.result;
    if (r.state !== "completed") {
      return { id: t.name, hz: 0, meanMs: 0 };
    }
    return {
      id: t.name,
      hz: r.throughput.mean,
      meanMs: r.latency.mean * 1000,
    };
  });
}

void main().then((rows) => {
  console.log(JSON.stringify(rows));
});
