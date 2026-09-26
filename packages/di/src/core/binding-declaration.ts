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
 *
 * @since 0.11.0
 */
export type BindingDefinition<
  Value,
  Names extends string = string,
  Deps extends ReadonlyArray<InjectableDependency> = ReadonlyArray<InjectableDependency>,
> = ((BuiltDefinition<Value, Deps> & LifetimeDefinition<Value>) | ConstantDefinition<Value> | AliasDefinition<Value>) &
  SlotDefinition<Names> & { readonly when?: BindingConstraint | undefined };

type AnyDefinition = BindingDefinition<unknown> | SelfDefinition<unknown>;

// Only this module can mint the symbol, so an entry carrying it was made by `binding()`.
const declarationBrand: unique symbol = Symbol("di:binding-declaration");

/**
 * A checked, normalised binding that `Module.fromBindings` groups into a declared module.
 *
 * @remarks Opaque: only `binding()` makes one, so a declared module that was built can always load.
 *
 * @since 0.11.0
 */
export interface BindingDeclaration {
  readonly [declarationBrand]: true;
}

// ── Declaration ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The runtime form of a `BindingDeclaration`: the binding fields a container copies into each binding it registers.
 *
 * @remarks Built at one site in `binding()`, so every declaration shares a hidden class.
 *
 * @since 0.11.0
 */
export interface DeclaredBinding extends BindingDeclaration {
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

/** Whether an entry carries the brand `binding()` alone sets, and so every field a declaration holds. */
function isDeclaredBinding(entry: BindingDeclaration): entry is DeclaredBinding {
  // Plain JavaScript can hand over anything, `null` included.
  return typeof entry === "object" && entry !== null && entry[declarationBrand] === true;
}

/**
 * Narrows a list entry to the declaration it must be, or throws for anything `binding()` did not make.
 *
 * @since 0.11.0
 */
export function asDeclaredBinding(entry: BindingDeclaration, moduleName: string, index: number): DeclaredBinding {
  if (!isDeclaredBinding(entry)) {
    throw new InvalidBindingDeclarationError(
      `${moduleName}[${String(index)}]`,
      "the entry is not a declaration made by binding()",
    );
  }
  return entry;
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

const SCOPES: ReadonlySet<string> = new Set<BindingScope>(["singleton", "transient", "scoped"]);

function isStrategy(key: string): key is Strategy {
  return STRATEGIES.has(key);
}

/** `Array.isArray` for a read-only list, which the built-in guard does not narrow. */
function isReadonlyList<Item>(value: Item | ReadonlyArray<Item> | undefined): value is ReadonlyArray<Item> {
  return Array.isArray(value);
}

/** The strategy key a definition names, when it names exactly one. */
function strategyOf(name: string, definition: AnyDefinition): Strategy {
  let strategy: Strategy | undefined;
  for (const key of Object.keys(definition)) {
    if (!DEFINITION_KEYS.has(key)) {
      throw new InvalidBindingDeclarationError(name, `\`${key}\` is not a definition key`);
    }
    if (isStrategy(key)) {
      if (strategy !== undefined) {
        throw new InvalidBindingDeclarationError(name, `it names two strategies, \`${strategy}\` and \`${key}\``);
      }
      strategy = key;
    }
  }
  if (strategy === undefined) {
    throw new InvalidBindingDeclarationError(name, "it names no strategy");
  }
  return strategy;
}

/** The slot `whenNamed` then each `whenTagged` criterion builds, one chain step at a time. */
function slotOf(definition: AnyDefinition): BindingSlot {
  let slot = DEFAULT_BINDING_SLOT;
  if (definition.whenNamed !== undefined) {
    slot = withSlotCriterion(slot, slotName.of(definition.whenNamed));
  }
  const tagged = definition.whenTagged;
  if (tagged !== undefined) {
    for (const criterion of isReadonlyList(tagged) ? tagged : [tagged]) {
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
// The value type is erased here, once: the overloads above are what a caller is checked against.
/**
 * @since 0.11.0
 */
export function binding(key: Token<unknown> | Constructor, definition: AnyDefinition): BindingDeclaration {
  const name = tokenName(key);
  const strategy = strategyOf(name, definition);

  let kind: BindingKind;
  let target: unknown;
  let factory: unknown;
  let value: unknown;
  let deps: ReadonlyArray<InjectionDescriptor> | undefined;
  switch (strategy) {
    case "to":
      kind = "class";
      target = definition.to;
      break;
    case "toSelf":
      // Plain JavaScript can pass `toSelf: false`; the type admits `true` alone.
      if (definition.toSelf !== true) {
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
      value = definition.toConstantValue;
      break;
    case "toDynamic":
      kind = "dynamic";
      factory = definition.toDynamic;
      break;
    case "toDynamicAsync":
      kind = "dynamic-async";
      factory = definition.toDynamicAsync;
      break;
    case "toResolved":
    case "toResolvedAsync": {
      const declaredDeps = definition.deps;
      if (!isReadonlyList(declaredDeps)) {
        throw new InvalidBindingDeclarationError(name, `\`${strategy}\` needs \`deps\`, an array`);
      }
      kind = strategy === "toResolved" ? "resolved" : "resolved-async";
      factory = strategy === "toResolved" ? definition.toResolved : definition.toResolvedAsync;
      deps = declaredDeps.map((dependency) => normalizeToDescriptor(dependency));
      break;
    }
    case "toAlias":
      kind = "alias";
      target = definition.toAlias;
      break;
  }
  if (deps === undefined && definition.deps !== undefined) {
    throw new InvalidBindingDeclarationError(name, "`deps` belongs to `toResolved` or `toResolvedAsync`");
  }

  let scope: BindingScope = kind === "constant" ? "singleton" : "transient";
  if (definition.scope !== undefined) {
    if (kind === "constant" || kind === "alias") {
      throw new InvalidBindingDeclarationError(name, `\`${strategy}\` takes no \`scope\``);
    }
    if (!SCOPES.has(definition.scope)) {
      throw new InvalidBindingDeclarationError(name, "`scope` is not one of singleton, transient or scoped");
    }
    scope = definition.scope;
  }
  const { onActivation, onDeactivation } = definition;
  if (kind === "alias" && (onActivation !== undefined || onDeactivation !== undefined)) {
    throw new InvalidBindingDeclarationError(name, "`toAlias` takes no lifecycle hook");
  }
  if (onDeactivation !== undefined && kind !== "constant" && scope !== "singleton") {
    throw new InvalidBindingDeclarationError(name, '`onDeactivation` needs `scope: "singleton"`');
  }

  if (definition.many !== undefined && definition.many !== true) {
    throw new InvalidBindingDeclarationError(name, "`many` takes `true`");
  }
  const isMany = definition.many === true;
  const slot = slotOf(definition);
  if (isMany && slot.tags.length !== 0) {
    throw new ManyBindingSlotError(name);
  }

  const declared: DeclaredBinding = {
    [declarationBrand]: true,
    token: key,
    kind,
    scope,
    target,
    factory,
    value,
    deps,
    slot,
    predicate: definition.when,
    isMany,
    activationHook: onActivation,
    deactivationHook: onDeactivation,
  };
  return declared;
}
