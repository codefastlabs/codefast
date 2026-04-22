/**
 * @codefast/di — same logical scenarios as `inversify-benches.ts` for side-by-side comparison.
 * Run via: `pnpm exec tsx --tsconfig tsconfig.codefast.json src/codefast-benches.ts`
 */
import { Bench } from "tinybench";
import { Container, injectable, Module, token } from "@codefast/di";

/** Default duration (keep in sync with inversify-benches.ts). Raise locally for stabler numbers. */
const BENCH_OPTIONS = {
  time: 450,
  iterations: 800,
  warmupTime: 60,
  warmupIterations: 60,
} as const;

/** Keep numeric knobs in sync with `inversify-benches.ts`. */
const WIDE_N = 48;
const CHAIN_DEEP = 16;
const ROTATE_N = 32;
const MODULE_BINDS = 20;
const CHILD_DEPTH = 8;

const constantTok = token<number>("bench-cf-constant");
const wideTok = token<number>("bench-cf-wide");

@injectable([])
class CfDep {}

const depClassTok = token<CfDep>("bench-cf-dep-class");
const svcClassTok = token<CfService>("bench-cf-svc-class");

@injectable([depClassTok])
class CfService {
  constructor(readonly dep: CfDep) {}
}

function buildConstantBench(): () => void {
  const c = Container.create();
  c.bind(constantTok).toConstantValue(42);
  c.resolve(constantTok);
  return () => {
    c.resolve(constantTok);
  };
}

function buildSingletonClassBench(): () => void {
  const c = Container.create();
  c.bind(depClassTok).to(CfDep).singleton();
  c.bind(svcClassTok).to(CfService).singleton();
  c.resolve(svcClassTok);
  return () => {
    c.resolve(svcClassTok);
  };
}

function buildTransientClassBench(): () => void {
  const c = Container.create();
  c.bind(depClassTok).to(CfDep);
  c.bind(svcClassTok).to(CfService).transient();
  return () => {
    c.resolve(svcClassTok);
  };
}

function buildNamedConstantBench(): () => void {
  const c = Container.create();
  c.bind(wideTok).whenNamed("slot-5").toConstantValue(5);
  c.bind(wideTok).whenNamed("slot-12").toConstantValue(12);
  c.bind(wideTok).whenNamed("slot-20").toConstantValue(20);
  c.resolve(wideTok, { name: "slot-12" });
  return () => {
    c.resolve(wideTok, { name: "slot-12" });
  };
}

function buildDynamicChain4Bench(): () => void {
  const t0 = token<number>("cf-chain-0");
  const t1 = token<number>("cf-chain-1");
  const t2 = token<number>("cf-chain-2");
  const t3 = token<number>("cf-chain-3");
  const c = Container.create();
  c.bind(t0).toConstantValue(0);
  c.bind(t1)
    .toDynamic((ctx) => ctx.resolve(t0) + 1)
    .transient();
  c.bind(t2)
    .toDynamic((ctx) => ctx.resolve(t1) + 1)
    .transient();
  c.bind(t3)
    .toDynamic((ctx) => ctx.resolve(t2) + 1)
    .transient();
  c.resolve(t3);
  return () => {
    c.resolve(t3);
  };
}

function buildDynamicTransientChain16Bench(): () => void {
  const tokens = Array.from({ length: CHAIN_DEEP }, (_, i) => token<number>(`cf-deep-${i}`));
  const c = Container.create();
  c.bind(tokens[0]!).toConstantValue(0);
  for (let i = 1; i < CHAIN_DEEP; i++) {
    const prev = tokens[i - 1]!;
    const cur = tokens[i]!;
    c.bind(cur)
      .toDynamic((ctx) => ctx.resolve(prev) + 1)
      .transient();
  }
  const leaf = tokens[CHAIN_DEEP - 1]!;
  c.resolve(leaf);
  return () => {
    c.resolve(leaf);
  };
}

function buildResolveAllNamed48Bench(): () => void {
  const wide = token<number>("bench-cf-wide-48");
  const c = Container.create();
  for (let i = 0; i < WIDE_N; i++) {
    c.bind(wide).whenNamed(`slot-${i}`).toConstantValue(i);
  }
  c.resolveAll(wide);
  return () => {
    c.resolveAll(wide);
  };
}

function buildRotateConstants32Bench(): () => void {
  const tokens = Array.from({ length: ROTATE_N }, (_, i) => token<number>(`bench-cf-rot-${i}`));
  const c = Container.create();
  for (let i = 0; i < ROTATE_N; i++) {
    c.bind(tokens[i]!).toConstantValue(i);
  }
  let idx = 0;
  return () => {
    void c.resolve(tokens[idx]!);
    idx = (idx + 1) % ROTATE_N;
  };
}

function buildChildInheritResolve8Bench(): () => void {
  const leafTok = token<number>("bench-cf-child-leaf");
  const root = Container.create();
  root.bind(leafTok).toConstantValue(42);
  let cur: Container = root;
  for (let d = 0; d < CHILD_DEPTH; d++) {
    cur = cur.createChild();
  }
  cur.resolve(leafTok);
  return () => {
    cur.resolve(leafTok);
  };
}

function buildFromModules20Bench(): () => void {
  const mod = Module.create("bench-cf-mod20", (api) => {
    for (let i = 0; i < MODULE_BINDS; i++) {
      api.bind(token<number>(`bench-cf-mod-t-${i}`)).toConstantValue(i);
    }
  });
  return () => {
    Container.fromModules(mod);
  };
}

function buildMixedResolveBurstBench(): () => void {
  const cTok = token<number>("bench-cf-mix-c");
  const wTok = token<number>("bench-cf-mix-wide");
  const d0 = token<number>("bench-cf-mix-d0");
  const d1 = token<number>("bench-cf-mix-d1");
  const d2 = token<number>("bench-cf-mix-d2");
  const d3 = token<number>("bench-cf-mix-d3");

  const c = Container.create();
  c.bind(cTok).toConstantValue(1);
  c.bind(wTok).whenNamed("a").toConstantValue(10);
  c.bind(wTok).whenNamed("b").toConstantValue(20);
  c.bind(wTok).whenNamed("c").toConstantValue(30);
  c.bind(d0).toConstantValue(0);
  c.bind(d1)
    .toDynamic((ctx) => ctx.resolve(d0) + 1)
    .transient();
  c.bind(d2)
    .toDynamic((ctx) => ctx.resolve(d1) + 1)
    .transient();
  c.bind(d3)
    .toDynamic((ctx) => ctx.resolve(d2) + 1)
    .transient();
  c.bind(depClassTok).to(CfDep).singleton();
  c.bind(svcClassTok).to(CfService).singleton();

  c.resolve(cTok);
  c.resolve(wTok, { name: "b" });
  c.resolve(d3);
  c.resolve(svcClassTok);

  return () => {
    c.resolve(cTok);
    c.resolve(cTok);
    c.resolve(wTok, { name: "a" });
    c.resolve(wTok, { name: "b" });
    c.resolve(wTok, { name: "c" });
    c.resolve(d3);
    c.resolve(svcClassTok);
    c.resolve(svcClassTok);
  };
}

function buildContainerCreateBench(): () => void {
  return () => {
    Container.create();
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
