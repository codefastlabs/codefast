/**
 * A binding written as data: `binding()` checks a definition once and normalises it into the
 * declaration a declared module files when it loads.
 */
import type { BindingSlot } from "#core/binding";
import { DEFAULT_BINDING_SLOT, withSlotCriterion } from "#core/binding";
import type { BindingTag } from "#core/tag";
import { slotName } from "#core/tag";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type {
  ActivationHandler,
  BindingConstraint,
  BindingKind,
  BindingScope,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
} from "#core/types";
import { InvalidBindingDeclarationError, ManyBindingSlotError, SelfBindingRequiresClassError } from "#errors/errors";
import type { InjectableDependency, InjectionDescriptor, ResolvedDependencyValue } from "#injection/descriptor";
import { normalizeToDescriptor } from "#injection/descriptor";

// ── Definition ───────────────────────────────────────────────────────────────────────────────────────────────────────

type Never<Keys extends PropertyKey> = { readonly [Key in Keys]?: never };

type StrategyKey =
  | "to"
  | "toSelf"
  | "toConstantValue"
  | "toDynamic"
  | "toDynamicAsync"
  | "toResolved"
  | "toResolvedAsync"
  | "toAlias"
  | "deps";

type ResolvedParameters<Deps extends ReadonlyArray<InjectableDependency>> = {
  [Index in keyof Deps]: ResolvedDependencyValue<NoInfer<Deps>[Index]>;
};

/** Where the binding sits: a name and criteria, or a collection member, which has no slot to take. */
type SlotDefinition<Names extends string> =
  | ({
      readonly whenNamed?: Names | undefined;
      readonly whenTagged?: BindingTag | ReadonlyArray<BindingTag> | undefined;
    } & Never<"many">)
  | ({ readonly many: true } & Never<"whenNamed" | "whenTagged">);

/** How long an instance lives, and the hooks that lifetime allows. */
type LifetimeDefinition<Value> =
  | {
      readonly scope: "singleton";
      readonly onActivation?: ActivationHandler<Value> | undefined;
      readonly onDeactivation?: DeactivationHandler<Value> | undefined;
    }
  | ({
      readonly scope?: "transient" | "scoped" | undefined;
      readonly onActivation?: ActivationHandler<Value> | undefined;
    } & Never<"onDeactivation">);

type BuiltDefinition<Value, Deps extends ReadonlyArray<InjectableDependency>> =
  | ({ readonly to: Constructor<Value> } & Never<Exclude<StrategyKey, "to">>)
  | ({ readonly toDynamic: (ctx: ResolutionContext) => Value } & Never<Exclude<StrategyKey, "toDynamic">>)
  | ({ readonly toDynamicAsync: (ctx: ResolutionContext) => Promise<Value> } & Never<
      Exclude<StrategyKey, "toDynamicAsync">
    >)
  | ({ readonly toResolved: (...args: ResolvedParameters<Deps>) => Value; readonly deps: Deps } & Never<
      Exclude<StrategyKey, "toResolved" | "deps">
    >)
  | ({ readonly toResolvedAsync: (...args: ResolvedParameters<Deps>) => Promise<Value>; readonly deps: Deps } & Never<
      Exclude<StrategyKey, "toResolvedAsync" | "deps">
    >);

type ConstantDefinition<Value> = {
  readonly toConstantValue: Value;
  readonly onActivation?: ActivationHandler<Value> | undefined;
  readonly onDeactivation?: DeactivationHandler<Value> | undefined;
} & Never<Exclude<StrategyKey, "toConstantValue"> | "scope">;

type AliasDefinition<Value> = { readonly toAlias: Token<Value> | Constructor<Value> } & Never<
  Exclude<StrategyKey, "toAlias"> | "scope" | "onActivation" | "onDeactivation"
>;

type SelfDefinition<Value> = { readonly toSelf: true } & Never<Exclude<StrategyKey, "toSelf">> &
  LifetimeDefinition<Value> &
  SlotDefinition<string> & { readonly when?: BindingConstraint | undefined };

/**
 * One binding spelled with the fluent chain's vocabulary: a single strategy key, then the slot,
 * `when`, `many`, `scope` and hooks that strategy allows.
 *
 * @typeParam Names - The slot names `whenNamed` accepts, the token's own.
 * @typeParam Deps - The dependencies `toResolved` and `toResolvedAsync` infer their parameters from.
 */
export type BindingDefinition<
  Value,
  Names extends string = string,
  Deps extends ReadonlyArray<InjectableDependency> = ReadonlyArray<InjectableDependency>,
> = ((BuiltDefinition<Value, Deps> & LifetimeDefinition<Value>) | ConstantDefinition<Value> | AliasDefinition<Value>) &
  SlotDefinition<Names> & { readonly when?: BindingConstraint | undefined };

declare const declarationBrand: unique symbol;

/**
 * A checked, normalised binding that `Module.fromBindings` groups into a declared module.
 *
 * @remarks Opaque: only `binding()` makes one, so a declared module that was built can always load.
 */
export interface BindingDeclaration {
  readonly [declarationBrand]: true;
}

// ── Declaration ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * What a declaration holds: the binding fields a container copies into each binding it files.
 */
interface DeclaredBindingFields {
  readonly token: Token<unknown> | Constructor;
  readonly kind: BindingKind;
  readonly scope: BindingScope;
  readonly target: unknown;
  readonly factory: unknown;
  readonly value: unknown;
  readonly deps: ReadonlyArray<InjectionDescriptor> | undefined;
  readonly slot: BindingSlot;
  readonly predicate: BindingConstraint | undefined;
  readonly isMany: boolean;
  readonly activationHook: ActivationHandler<unknown> | undefined;
  readonly deactivationHook: DeactivationHandler<unknown> | undefined;
}

/**
 * The runtime form of a `BindingDeclaration`: one class, so every declaration shares a hidden class
 * and a declared module can tell its entries apart from anything else.
 */
export class DeclaredBinding implements DeclaredBindingFields {
  readonly token: Token<unknown> | Constructor;
  readonly kind: BindingKind;
  readonly scope: BindingScope;
  readonly target: unknown;
  readonly factory: unknown;
  readonly value: unknown;
  readonly deps: ReadonlyArray<InjectionDescriptor> | undefined;
  readonly slot: BindingSlot;
  readonly predicate: BindingConstraint | undefined;
  readonly isMany: boolean;
  readonly activationHook: ActivationHandler<unknown> | undefined;
  readonly deactivationHook: DeactivationHandler<unknown> | undefined;

  constructor(fields: DeclaredBindingFields) {
    this.token = fields.token;
    this.kind = fields.kind;
    this.scope = fields.scope;
    this.target = fields.target;
    this.factory = fields.factory;
    this.value = fields.value;
    this.deps = fields.deps;
    this.slot = fields.slot;
    this.predicate = fields.predicate;
    this.isMany = fields.isMany;
    this.activationHook = fields.activationHook;
    this.deactivationHook = fields.deactivationHook;
  }
}

/**
 * Narrows a list entry to the declaration it must be, or throws for anything `binding()` did not make.
 */
export function asDeclaredBinding(entry: BindingDeclaration, moduleName: string, index: number): DeclaredBinding {
  if (!((entry as unknown) instanceof DeclaredBinding)) {
    throw new InvalidBindingDeclarationError(
      `${moduleName}[${String(index)}]`,
      "the entry is not a declaration made by binding()",
    );
  }
  return entry as unknown as DeclaredBinding;
}

// ── Factory ──────────────────────────────────────────────────────────────────────────────────────────────────────────

type Strategy = Exclude<StrategyKey, "deps">;

const STRATEGIES: ReadonlySet<string> = new Set<Strategy>([
  "to",
  "toSelf",
  "toConstantValue",
  "toDynamic",
  "toDynamicAsync",
  "toResolved",
  "toResolvedAsync",
  "toAlias",
]);

const DEFINITION_KEYS: ReadonlySet<string> = new Set([
  ...STRATEGIES,
  "deps",
  "whenNamed",
  "whenTagged",
  "when",
  "many",
  "scope",
  "onActivation",
  "onDeactivation",
]);

const SCOPES: ReadonlySet<unknown> = new Set<BindingScope>(["singleton", "transient", "scoped"]);

/** A definition as plain JavaScript may pass it, past everything the compiler would have rejected. */
interface LooseDefinition {
  readonly [key: string]: unknown;
}

/** The strategy key a definition names, when it names exactly one. */
function strategyOf(name: string, definition: LooseDefinition): Strategy {
  let strategy: string | undefined;
  for (const key of Object.keys(definition)) {
    if (!DEFINITION_KEYS.has(key)) {
      throw new InvalidBindingDeclarationError(name, `\`${key}\` is not a definition key`);
    }
    if (STRATEGIES.has(key)) {
      if (strategy !== undefined) {
        throw new InvalidBindingDeclarationError(name, `it names two strategies, \`${strategy}\` and \`${key}\``);
      }
      strategy = key;
    }
  }
  if (strategy === undefined) {
    throw new InvalidBindingDeclarationError(name, "it names no strategy");
  }
  return strategy as Strategy;
}

/** The slot `whenNamed` then each `whenTagged` criterion builds, one chain step at a time. */
function slotOf(definition: LooseDefinition): BindingSlot {
  let slot = DEFAULT_BINDING_SLOT;
  if (definition.whenNamed !== undefined) {
    slot = withSlotCriterion(slot, slotName.of(definition.whenNamed as string));
  }
  const tagged = definition.whenTagged as BindingTag | ReadonlyArray<BindingTag> | undefined;
  if (tagged !== undefined) {
    for (const criterion of Array.isArray(tagged) ? (tagged as ReadonlyArray<BindingTag>) : [tagged as BindingTag]) {
      slot = withSlotCriterion(slot, criterion);
    }
  }
  return slot;
}

/**
 * Declares one binding for `Module.fromBindings`, checked against the fluent chain's rules where it is written.
 *
 * @remarks The key alone decides the value type and the slot names; the definition never widens them.
 *
 * @throws `InvalidBindingDeclarationError` for no strategy, several, or a key the strategy does not allow.
 * @throws `ManyBindingSlotError` for a slot on a collection member.
 * @throws `SelfBindingRequiresClassError` for `toSelf` on a key that is not a class.
 */
export function binding<Value, Names extends string, const Deps extends ReadonlyArray<InjectableDependency> = []>(
  key: Token<Value, Names>,
  definition: BindingDefinition<NoInfer<Value>, NoInfer<Names>, Deps>,
): BindingDeclaration;
export function binding<Value, const Deps extends ReadonlyArray<InjectableDependency> = []>(
  key: Constructor<Value>,
  definition: BindingDefinition<NoInfer<Value>, string, Deps> | SelfDefinition<NoInfer<Value>>,
): BindingDeclaration;
export function binding(key: Token<unknown> | Constructor, definition: object): BindingDeclaration {
  const name = tokenName(key);
  const loose = definition as LooseDefinition;
  const strategy = strategyOf(name, loose);

  let kind: BindingKind;
  let target: unknown;
  let factory: unknown;
  let value: unknown;
  let deps: ReadonlyArray<InjectionDescriptor> | undefined;
  switch (strategy) {
    case "to":
      kind = "class";
      target = loose.to;
      break;
    case "toSelf":
      if (loose.toSelf !== true) {
        throw new InvalidBindingDeclarationError(name, "`toSelf` takes `true`");
      }
      if (typeof key !== "function") {
        throw new SelfBindingRequiresClassError(name);
      }
      kind = "class";
      target = key;
      break;
    case "toConstantValue":
      kind = "constant";
      value = loose.toConstantValue;
      break;
    case "toDynamic":
    case "toDynamicAsync":
      kind = strategy === "toDynamic" ? "dynamic" : "dynamic-async";
      factory = loose[strategy];
      break;
    case "toResolved":
    case "toResolvedAsync": {
      if (!Array.isArray(loose.deps)) {
        throw new InvalidBindingDeclarationError(name, `\`${strategy}\` needs \`deps\`, an array`);
      }
      kind = strategy === "toResolved" ? "resolved" : "resolved-async";
      factory = loose[strategy];
      deps = (loose.deps as ReadonlyArray<InjectableDependency>).map((dependency) => normalizeToDescriptor(dependency));
      break;
    }
    case "toAlias":
      kind = "alias";
      target = loose.toAlias;
      break;
  }
  if (deps === undefined && loose.deps !== undefined) {
    throw new InvalidBindingDeclarationError(name, "`deps` belongs to `toResolved` or `toResolvedAsync`");
  }

  let scope: BindingScope = kind === "constant" ? "singleton" : "transient";
  if (loose.scope !== undefined) {
    if (kind === "constant" || kind === "alias") {
      throw new InvalidBindingDeclarationError(name, `\`${strategy}\` takes no \`scope\``);
    }
    if (!SCOPES.has(loose.scope)) {
      throw new InvalidBindingDeclarationError(name, "`scope` is not one of singleton, transient or scoped");
    }
    scope = loose.scope as BindingScope;
  }
  const activationHook = loose.onActivation as ActivationHandler<unknown> | undefined;
  const deactivationHook = loose.onDeactivation as DeactivationHandler<unknown> | undefined;
  if (kind === "alias" && (activationHook !== undefined || deactivationHook !== undefined)) {
    throw new InvalidBindingDeclarationError(name, "`toAlias` takes no lifecycle hook");
  }
  if (deactivationHook !== undefined && kind !== "constant" && scope !== "singleton") {
    throw new InvalidBindingDeclarationError(name, '`onDeactivation` needs `scope: "singleton"`');
  }

  if (loose.many !== undefined && loose.many !== true) {
    throw new InvalidBindingDeclarationError(name, "`many` takes `true`");
  }
  const isMany = loose.many === true;
  const slot = slotOf(loose);
  if (isMany && slot.tags.length !== 0) {
    throw new ManyBindingSlotError(name);
  }

  const declared = new DeclaredBinding({
    token: key,
    kind,
    scope,
    target,
    factory,
    value,
    deps,
    slot,
    predicate: loose.when as BindingConstraint | undefined,
    isMany,
    activationHook,
    deactivationHook,
  });
  // The one place the runtime class becomes the opaque public type.
  return declared as unknown as BindingDeclaration;
}
