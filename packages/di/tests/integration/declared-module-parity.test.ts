/**
 * A declared module loads exactly as a setup that binds each declaration through the fluent chain,
 * in list order: the same bindings in the same order, the same answers, and the same state after
 * an unload — over any list, on a container that already holds bindings of its own.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { BindingChain } from "#container/binding-builders";
import { Container } from "#container/container";
import { binding } from "#core/binding-declaration";
import type { BindingDeclaration } from "#core/binding-declaration";
import { Module } from "#core/module";
import type { ModuleBuilder, SyncModule } from "#core/module";
import { tag } from "#core/tag";
import type { BindingTag } from "#core/tag";
import { token } from "#core/token";
import type { Token } from "#core/token";
import type { BindingConstraint, BindingIdentifier, BindingScope, ResolveOptions } from "#core/types";
import { optional } from "#injection/descriptor";
import type { ContainerGraphJson } from "#introspection/dependency-graph";

/** A class key, so `toSelf` and the constructor lane are covered beside the token lane. */
class Keyed {
  readonly value = "keyed";
}

/** What `to` builds; each declaration subclasses it to carry its own value. */
class Built {
  readonly value: string = "built";
}

const Primary = token<unknown, "primary" | "replica">("dmp:Primary");
const Secondary = token<unknown, "primary" | "replica">("dmp:Secondary");
const AliasTarget = token<unknown>("dmp:AliasTarget");
const Region = tag<"eu" | "us">("dmp:region");
const Size = tag<"s" | "l">("dmp:size");

type Key = Token<unknown, "primary" | "replica"> | typeof Keyed;

const KEYS: ReadonlyArray<Key> = [Primary, Secondary, Keyed];
const NAMES = ["primary", "replica"] as const;
const CRITERIA: ReadonlyArray<BindingTag> = [Region.of("eu"), Region.of("us"), Size.of("s"), Size.of("l")];
const QUERIES: ReadonlyArray<ResolveOptions<"primary" | "replica">> = [
  {},
  { name: "primary" },
  { name: "replica" },
  { tag: Region.of("eu") },
  { tags: [Region.of("us"), Size.of("l")] },
];
const PREDICATES: ReadonlyArray<BindingConstraint> = [() => true, () => false];
const NUM_RUNS = Number(process.env["DIFF_RUNS"] ?? "400");
// Hundreds of lists, each loaded, observed and unloaded twice: seconds here, more under a CI runner's coverage.
const PROPERTY_TIMEOUT_MS = 120_000;

// ── Declarations as data ─────────────────────────────────────────────────────────────────────────────────────────────

type StrategySpec = "constant" | "dynamic" | "resolved" | "class" | "alias" | "self";

/** One generated declaration, from which both the declared and the fluent form are built. */
interface DeclarationSpec {
  readonly key: number;
  readonly strategy: StrategySpec;
  readonly slot: "default" | "named" | "tagged" | "member";
  readonly name: number;
  readonly criteria: ReadonlyArray<number>;
  readonly when: number | undefined;
  readonly scope: BindingScope | undefined;
  readonly activation: boolean;
  readonly deactivation: boolean;
}

const declarationSpec: fc.Arbitrary<DeclarationSpec> = fc.record({
  key: fc.nat(KEYS.length - 1),
  strategy: fc.constantFrom<StrategySpec>("constant", "dynamic", "resolved", "class", "alias", "self"),
  slot: fc.constantFrom("default", "named", "tagged", "member"),
  name: fc.nat(NAMES.length - 1),
  criteria: fc.array(fc.nat(CRITERIA.length - 1), { maxLength: 3 }),
  when: fc.option(fc.nat(PREDICATES.length - 1), { nil: undefined }),
  scope: fc.option(fc.constantFrom<BindingScope>("singleton", "transient", "scoped"), { nil: undefined }),
  activation: fc.boolean(),
  deactivation: fc.boolean(),
});

/** The spec with every rule the compiler enforces applied, so both forms are well-formed. */
function wellFormed(spec: DeclarationSpec): DeclarationSpec {
  const strategy = spec.strategy === "self" && KEYS[spec.key] !== Keyed ? "constant" : spec.strategy;
  const fixedScope = strategy === "constant" || strategy === "alias";
  const scope = fixedScope ? undefined : spec.scope;
  return {
    ...spec,
    strategy,
    scope,
    activation: strategy !== "alias" && spec.activation,
    deactivation: strategy !== "alias" && spec.deactivation && (strategy === "constant" || scope === "singleton"),
  };
}

/** Per-container observations the hooks write, so hook calls and their order are compared too. */
type HookLog = Array<string>;

function valueOf(index: number): string {
  return `v${String(index)}`;
}

/** `binding()` as a definition assembled at run time reaches it, one key per spec field. */
const looseBinding = binding as (key: Key, definition: object) => BindingDeclaration;

function declare(spec: DeclarationSpec, index: number, log: HookLog): BindingDeclaration {
  const key = KEYS[spec.key]!;
  const value = valueOf(index);
  const definition: Record<string, unknown> = {};
  switch (spec.strategy) {
    case "constant":
      definition["toConstantValue"] = value;
      break;
    case "dynamic":
      definition["toDynamic"] = () => value;
      break;
    case "resolved":
      definition["toResolved"] = (secondary: unknown) => `${value}<${String(secondary)}>`;
      definition["deps"] = [optional(Secondary)];
      break;
    case "class":
      definition["to"] = class extends Built {
        override readonly value = value;
      };
      break;
    case "alias":
      definition["toAlias"] = AliasTarget;
      break;
    case "self":
      definition["toSelf"] = true;
      break;
  }
  if (spec.slot === "named") {
    definition["whenNamed"] = NAMES[spec.name];
  } else if (spec.slot === "tagged") {
    definition["whenTagged"] = spec.criteria.map((criterion) => CRITERIA[criterion]!);
  } else if (spec.slot === "member") {
    definition["many"] = true;
  }
  if (spec.when !== undefined) {
    definition["when"] = PREDICATES[spec.when];
  }
  if (spec.scope !== undefined) {
    definition["scope"] = spec.scope;
  }
  if (spec.activation) {
    definition["onActivation"] = (_ctx: unknown, instance: unknown) => {
      log.push(`activate ${value}`);
      return instance;
    };
  }
  if (spec.deactivation) {
    definition["onDeactivation"] = () => {
      log.push(`deactivate ${value}`);
    };
  }
  return looseBinding(key, definition);
}

/**
 * The reference: each spec bound through the chain steps SPEC names, in its order — strategy, slot,
 * `when`, `many`, scope, hooks — written without reading the declared path.
 */
function bindFluently(builder: ModuleBuilder, spec: DeclarationSpec, index: number, log: HookLog): void {
  const value = valueOf(index);
  // `bind()` returns the one builder class. Its step types are what forbid a bad order, and this
  // reference drives the steps in SPEC's order on the object itself, so it needs the whole class.
  const chain = builder.bind<unknown>(KEYS[spec.key]!) as BindingChain<unknown>;
  switch (spec.strategy) {
    case "constant":
      chain.toConstantValue(value);
      break;
    case "dynamic":
      chain.toDynamic(() => value);
      break;
    case "resolved":
      chain.toResolved((secondary) => `${value}<${String(secondary)}>`, [optional(Secondary)]);
      break;
    case "class":
      chain.to(
        class extends Built {
          override readonly value = value;
        },
      );
      break;
    case "alias":
      chain.toAlias(AliasTarget);
      break;
    case "self":
      chain.toSelf();
      break;
  }
  if (spec.slot === "named") {
    chain.whenNamed(NAMES[spec.name]!);
  } else if (spec.slot === "tagged") {
    for (const criterion of spec.criteria) {
      chain.whenTagged(CRITERIA[criterion]!);
    }
  }
  if (spec.when !== undefined) {
    chain.when(PREDICATES[spec.when]!);
  }
  if (spec.slot === "member") {
    chain.many();
  }
  if (spec.scope !== undefined) {
    chain[spec.scope]();
  }
  if (spec.activation) {
    chain.onActivation((_ctx, instance) => {
      log.push(`activate ${value}`);
      return instance;
    });
  }
  if (spec.deactivation) {
    chain.onDeactivation(() => {
      log.push(`deactivate ${value}`);
    });
  }
}

// ── Observation ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** The bindings a container held before the module loaded: a default, a named and a member per token. */
interface PreexistingSpec {
  readonly key: number;
  readonly slot: "default" | "named" | "member";
  readonly name: number;
}

const preexistingSpec: fc.Arbitrary<PreexistingSpec> = fc.record({
  key: fc.nat(KEYS.length - 1),
  slot: fc.constantFrom("default", "named", "member"),
  name: fc.nat(NAMES.length - 1),
});

function createHost(preexisting: ReadonlyArray<PreexistingSpec>, log: HookLog): Container {
  const container = Container.create();
  container.bind(AliasTarget).toConstantValue("aliased");
  for (const [index, spec] of preexisting.entries()) {
    const value = `pre${String(index)}`;
    const chain = container.bind<unknown, "primary" | "replica">(KEYS[spec.key]!).toConstantValue(value);
    if (spec.slot === "named") {
      chain.whenNamed(NAMES[spec.name]!);
    } else if (spec.slot === "member") {
      chain.many();
    }
    chain.onDeactivation(() => {
      log.push(`deactivate ${value}`);
    });
  }
  return container;
}

function describeValue(value: unknown): unknown {
  return value instanceof Built || value instanceof Keyed ? `instance:${value.value}` : value;
}

function attempt(read: () => unknown): unknown {
  try {
    return describeValue(read());
  } catch (error) {
    return { error: error instanceof Error ? error.name : String(error) };
  }
}

/** Ids renumbered by rank, keyed as the graph spells them, since ids are process-wide and each host minted its own. */
function rankIds(ids: ReadonlyArray<BindingIdentifier>): Map<string, number> {
  return new Map([...ids].sort((left, right) => left - right).map((id, rank) => [String(id), rank]));
}

/** A graph with its binding-id node ids renumbered by the same ranks as the snapshot. */
function rankGraph(graph: ContainerGraphJson, ranks: Map<string, number>): unknown {
  const rank = (id: string): string => String(ranks.get(id) ?? id);
  const byJson = (left: unknown, right: unknown): number => JSON.stringify(left).localeCompare(JSON.stringify(right));
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({ ...node, id: rank(node.id) })).toSorted(byJson),
    edges: graph.edges.map((edge) => ({ ...edge, from: rank(edge.from), to: rank(edge.to) })).toSorted(byJson),
  };
}

function observe(container: Container): unknown {
  const snapshot = container.inspect().ownBindings;
  const ranks = rankIds(snapshot.map((entry) => entry.id));
  const answers: Array<unknown> = [];
  for (const key of KEYS) {
    answers.push(key.name, container.has(key));
    answers.push(attempt(() => container.resolveAll(key).map(describeValue)));
    for (const query of QUERIES) {
      answers.push(attempt(() => container.resolveOptional(key, query)));
      // Twice, so a singleton's sharing is compared as well as its value.
      answers.push(attempt(() => container.resolveOptional(key, query) === container.resolveOptional(key, query)));
    }
  }
  return {
    // A token's bindings keep registration order; the order between tokens is not a contract.
    bindings: snapshot
      .map((entry) => ({ ...entry, id: ranks.get(String(entry.id)) }))
      .toSorted((left, right) => left.tokenName.localeCompare(right.tokenName)),
    answers,
    validate: attempt(() => {
      container.validate();
      return "valid";
    }),
    graph: rankGraph(container.generateDependencyGraph(), ranks),
  };
}

// ── Properties ───────────────────────────────────────────────────────────────────────────────────────────────────────

interface Run {
  readonly preexisting: ReadonlyArray<PreexistingSpec>;
  readonly declarations: ReadonlyArray<DeclarationSpec>;
}

const run: fc.Arbitrary<Run> = fc.record({
  preexisting: fc.array(preexistingSpec, { maxLength: 4 }),
  declarations: fc.array(declarationSpec.map(wellFormed), { maxLength: 12 }),
});

/** Loads the module each form builds into its own host and reports both hosts after load and unload. */
function compareForms(
  { preexisting, declarations }: Run,
  wrap: (module: SyncModule, name: string) => SyncModule,
): { declared: Array<unknown>; fluent: Array<unknown> } {
  const reports: Record<"declared" | "fluent", Array<unknown>> = { declared: [], fluent: [] };
  for (const form of ["declared", "fluent"] as const) {
    const log: HookLog = [];
    const host = createHost(preexisting, log);
    const module =
      form === "declared"
        ? Module.fromBindings(
            "dmp:Declared",
            declarations.map((spec, index) => declare(spec, index, log)),
          )
        : Module.create("dmp:Fluent", (builder) => {
            for (const [index, spec] of declarations.entries()) {
              bindFluently(builder, spec, index, log);
            }
          });
    const loaded = wrap(module, `dmp:${form}`);
    host.load(loaded);
    reports[form].push(observe(host));
    host.unload(loaded);
    reports[form].push(observe(host), [...log]);
    void host.dispose();
  }
  return reports;
}

describe("a declared module against the fluent setup it stands for", () => {
  it(
    "loads, answers and unloads identically for any list",
    () => {
      expect(() => {
        fc.assert(
          fc.property(run, (input) => {
            const { declared, fluent } = compareForms(input, (module) => module);
            expect(declared).toStrictEqual(fluent);
          }),
          { numRuns: NUM_RUNS },
        );
      }).not.toThrow();
    },
    PROPERTY_TIMEOUT_MS,
  );

  it(
    "does the same when a fluent module imports it",
    () => {
      expect(() => {
        fc.assert(
          fc.property(run, (input) => {
            const { declared, fluent } = compareForms(input, (module, name) =>
              Module.create(name, (builder) => {
                builder.bind(AliasTarget).toConstantValue("imported-beside");
                builder.import(module);
              }),
            );
            expect(declared).toStrictEqual(fluent);
          }),
          { numRuns: Math.ceil(NUM_RUNS / 3) },
        );
      }).not.toThrow();
    },
    PROPERTY_TIMEOUT_MS,
  );
});
