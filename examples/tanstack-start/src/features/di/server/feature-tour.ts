/**
 * Every `@codefast/di` API the task board does not already exercise, run for real on the server.
 *
 * @remarks The board covers constructor injection, modules, scopes, child containers and
 * introspection. This covers the rest, so between the two the example touches the whole surface.
 */
// Side-effect import: install the Map.prototype.getOrInsert polyfill before @codefast/di loads.
import "#/features/di/server/map-get-or-insert";
import {
  AsyncModule,
  bindingSlotToResolveOptions,
  Container,
  createAutoRegisterRegistry,
  getActiveContainer,
  inject,
  optional,
  injectionSlotToResolveOptions,
  isInjectionDescriptor,
  isSyncModule,
  isToken,
  runWithContainer,
  token,
  tokenName,
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "@codefast/di";
import {
  defaultMetadataReader,
  DiError,
  injectable,
  MetadataReaderToken,
  SymbolMetadataReader,
  SyncModule,
} from "@codefast/di";
import type { Constructor, ConstructorMetadata, MetadataReader, SlotConstrainedBuilder, Token } from "@codefast/di";
import { createServerFn } from "@tanstack/react-start";

/** One API exercised, with what came back out of it. */
export interface TourRow {
  api: string;
  what: string;
  result: string;
}

export interface TourSection {
  title: string;
  blurb: string;
  rows: Array<TourRow>;
}

export interface FeatureTour {
  sections: Array<TourSection>;
  /** Distinct API names this tour ran, for the badge on the card. */
  apiCount: number;
}

const ok = (value: unknown): string => String(value);

/* ── Binding kinds ───────────────────────────────────────────────────────── */

@injectable()
class Clock {
  readonly startedAt = "t0";
}

interface Config {
  readonly region: string;
}

async function tourBindingKinds(): Promise<TourSection> {
  const container = Container.create();
  const configToken = token<Config>("config");
  const aliasToken = token<Config>("config-alias");
  const dynamicToken = token<string>("dynamic");
  const asyncDynamicToken = token<string>("dynamic-async");
  const resolvedToken = token<string>("resolved");
  const asyncResolvedToken = token<string>("resolved-async");

  container.bind(Clock).toSelf().singleton();
  container.bind(configToken).toConstantValue({ region: "eu" });
  container.bind(aliasToken).toAlias(configToken);
  container.bind(dynamicToken).toDynamic((ctx) => `region=${ctx.resolve(configToken).region}`);
  container.bind(asyncDynamicToken).toDynamicAsync(async (ctx) => {
    await Promise.resolve();

    return `async region=${ctx.resolve(configToken).region}`;
  });
  container.bind(resolvedToken).toResolved((clock: Clock) => `clock=${clock.startedAt}`, [Clock]);
  container.bind(asyncResolvedToken).toResolvedAsync(
    async (clock: Clock) => {
      await Promise.resolve();

      return `async clock=${clock.startedAt}`;
    },
    [Clock],
  );

  return {
    title: "Binding kinds",
    blurb: "Every `to*` form, including the two that only a `resolveAsync` can complete.",
    rows: [
      {
        api: "toSelf()",
        what: "bind a class to itself as a singleton",
        result: ok(container.resolve(Clock).startedAt),
      },
      {
        api: "toAlias()",
        what: "a second token redirecting to the first",
        result: ok(container.resolve(aliasToken).region),
      },
      {
        api: "toDynamic()",
        what: "factory reading the resolution context",
        result: ok(container.resolve(dynamicToken)),
      },
      {
        api: "toDynamicAsync()",
        what: "async factory, awaited by resolveAsync",
        result: ok(await container.resolveAsync(asyncDynamicToken)),
      },
      {
        api: "toResolved()",
        what: "factory over an explicit deps array",
        result: ok(container.resolve(resolvedToken)),
      },
      {
        api: "toResolvedAsync()",
        what: "async factory over an explicit deps array",
        result: ok(await container.resolveAsync(asyncResolvedToken)),
      },
    ],
  };
}

/* ── Slot selection ──────────────────────────────────────────────────────── */

function tourSlotSelection(): TourSection {
  const container = Container.create();
  const engineToken = token<string>("engine");
  const fallbackToken = token<string>("fallback");

  container.bind(engineToken).toConstantValue("petrol").whenTagged("fuel", "petrol");
  container.bind(engineToken).toConstantValue("electric").whenTagged("fuel", "electric");
  // A specialisation of the petrol binding: more tags, so a request naming both takes it.
  container.bind(engineToken).toConstantValue("turbo-v8").whenTagged("fuel", "petrol").whenTagged("size", "v8");
  container.bind(fallbackToken).toConstantValue("default-slot").whenDefault();

  const byArray = container.resolve(engineToken, { tags: [["fuel", "petrol"]] });
  const byShorthand = container.resolve(engineToken, { tag: ["fuel", "petrol"] });

  return {
    title: "Slot selection",
    blurb: "Named and tagged slots, the one-tag shorthand, and the most-specific-wins rule between them.",
    rows: [
      { api: "whenTagged() + { tags }", what: "one tag, written as a list", result: ok(byArray) },
      {
        api: "{ tag } shorthand",
        what: "same request, shorter spelling — same answer and same lane",
        result: ok(byShorthand),
      },
      {
        api: "tag-count specificity",
        what: "request names fuel + size, two bindings match, the one declaring both wins",
        result: ok(
          container.resolve(engineToken, {
            tags: [
              ["fuel", "petrol"],
              ["size", "v8"],
            ],
          }),
        ),
      },
      {
        api: "whenDefault()",
        what: "the default slot, stated explicitly",
        result: ok(container.resolve(fallbackToken)),
      },
      {
        api: "resolveAll()",
        what: "every binding matching one tag, not just the winner",
        result: ok(container.resolveAll(engineToken, { tag: ["fuel", "petrol"] }).join(", ")),
      },
      {
        api: "has() / hasOwn()",
        what: "bound anywhere in the chain, versus bound on this container",
        result: `has=${ok(container.has(engineToken))} hasOwn=${ok(container.hasOwn(engineToken))}`,
      },
    ],
  };
}

/* ── Contextual constraints ──────────────────────────────────────────────── */

/** Where the slot the helper reads lives: on the immediate parent, or one level further up. */
type ConstrainedFrom = "parent" | "ancestor";

interface ProbeSlot {
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}

const SLOT_NAME = "primary";
const GOLD_EU: ReadonlyArray<readonly [string, unknown]> = [
  ["tier", "gold"],
  ["region", "eu"],
];

/**
 * One `logger` binding per helper, resolved through a frame shaped to satisfy it.
 *
 * @remarks `ancestors` does not include the immediate parent, so the ancestor helpers need a frame
 * above the parent — hence the two shapes rather than one.
 */
function tourContextualConstraints(): TourSection {
  const rows: Array<TourRow> = [];
  const loggerToken = token<string>("logger");

  const probe = (
    api: string,
    what: string,
    constrain: (container: Container, framed: Token<string>) => void,
    from: ConstrainedFrom = "parent",
    slot: ProbeSlot = {},
  ): void => {
    const container = Container.create();
    const serviceToken = token<string>("service");
    const outerToken = token<string>("outer");
    // The frame the helper reads: the logger's parent, or the one above it.
    const framedToken = from === "parent" ? serviceToken : outerToken;

    container.bind(loggerToken).toConstantValue("fallback");
    constrain(container, framedToken);

    // The request has to name every tag the framed slot declares, or it selects nothing.
    const request = slot.tags === undefined ? { name: SLOT_NAME } : { name: SLOT_NAME, tags: slot.tags };
    const applySlot = (builder: SlotConstrainedBuilder): SlotConstrainedBuilder => {
      let slotted = builder.whenNamed(SLOT_NAME);

      for (const [tagKey, tagValue] of slot.tags ?? []) {
        slotted = slotted.whenTagged(tagKey, tagValue);
      }

      return slotted;
    };

    if (from === "parent") {
      applySlot(container.bind(serviceToken).toDynamic((ctx) => ctx.resolve(loggerToken)));
    } else {
      container.bind(serviceToken).toDynamic((ctx) => ctx.resolve(loggerToken));
      applySlot(container.bind(outerToken).toDynamic((ctx) => ctx.resolve(serviceToken)));
    }

    rows.push({ api, what, result: ok(container.resolve(framedToken, request)) });
  };

  probe("whenParentIs()", "matches when the immediate parent is that token", (container, framed) =>
    container.bind(loggerToken).toConstantValue("parent-is").when(whenParentIs(framed)),
  );
  probe("whenNoParentIs()", "matches when the parent is not that token", (container) =>
    container
      .bind(loggerToken)
      .toConstantValue("no-parent-is")
      .when(whenNoParentIs(token("other"))),
  );
  probe("whenParentNamed()", "matches on the parent's name slot", (container) =>
    container.bind(loggerToken).toConstantValue("parent-named").when(whenParentNamed(SLOT_NAME)),
  );
  probe(
    "whenParentTagged()",
    "matches one tag on the parent's slot",
    (container) => container.bind(loggerToken).toConstantValue("parent-tagged").when(whenParentTagged("tier", "gold")),
    "parent",
    { tags: [["tier", "gold"]] },
  );
  probe(
    "whenParentTaggedAll()",
    "matches every listed tag on the parent in one pass",
    (container) => container.bind(loggerToken).toConstantValue("parent-tagged-all").when(whenParentTaggedAll(GOLD_EU)),
    "parent",
    { tags: GOLD_EU },
  );
  probe(
    "whenAnyAncestorIs()",
    "matches when that token is further up the resolution path",
    (container, framed) => container.bind(loggerToken).toConstantValue("ancestor-is").when(whenAnyAncestorIs(framed)),
    "ancestor",
  );
  probe(
    "whenNoAncestorIs()",
    "matches when that token is nowhere up the path",
    (container) =>
      container
        .bind(loggerToken)
        .toConstantValue("no-ancestor-is")
        .when(whenNoAncestorIs(token("absent"))),
    "ancestor",
  );
  probe(
    "whenAnyAncestorNamed()",
    "matches a name further up the path",
    (container) => container.bind(loggerToken).toConstantValue("ancestor-named").when(whenAnyAncestorNamed(SLOT_NAME)),
    "ancestor",
  );
  probe(
    "whenAnyAncestorTagged()",
    "matches one tag further up the path",
    (container) =>
      container.bind(loggerToken).toConstantValue("ancestor-tagged").when(whenAnyAncestorTagged("tier", "gold")),
    "ancestor",
    { tags: [["tier", "gold"]] },
  );
  probe(
    "whenAnyAncestorTaggedAll()",
    "matches every listed tag on one ancestor",
    (container) =>
      container.bind(loggerToken).toConstantValue("ancestor-tagged-all").when(whenAnyAncestorTaggedAll(GOLD_EU)),
    "ancestor",
    { tags: GOLD_EU },
  );

  return {
    title: "Contextual constraints",
    blurb: "The `when*` helpers that read the resolution path rather than the request.",
    rows,
  };
}

/* ── Modules and registry mutation ───────────────────────────────────────── */

async function tourModules(): Promise<TourSection> {
  const greetingToken = token<string>("greeting");
  const asyncGreetingToken = token<string>("greeting-async");

  const syncModule = SyncModule.create("greetings", (builder) => {
    builder.bind(greetingToken).toConstantValue("from sync module");
  });
  const asyncModule = AsyncModule.create("greetings-async", async (builder) => {
    await Promise.resolve();
    builder.bind(asyncGreetingToken).toConstantValue("from async module");
  });

  const container = Container.create();

  container.load(syncModule);
  const afterLoad = container.resolve(greetingToken);

  container.unload(syncModule);
  const afterUnload = container.resolveOptional(greetingToken);

  await container.loadAsync(asyncModule);
  const afterAsyncLoad = container.resolve(asyncGreetingToken);

  await container.unloadAsync(asyncModule);

  const fromModules = await Container.fromModulesAsync(asyncModule);

  const registry = createAutoRegisterRegistry();

  @injectable([], { autoRegister: registry, scope: "singleton" })
  class AutoRegistered {
    readonly label = "auto-registered";
  }

  const autoContainer = Container.create();
  const registeredCount = autoContainer.loadAutoRegistered(registry);

  return {
    title: "Modules and auto-registration",
    blurb: "Sync and async modules, loaded and unloaded, plus `@injectable`'s auto-register registry.",
    rows: [
      { api: "Module + load()", what: "bindings arrive with the module", result: ok(afterLoad) },
      { api: "unload()", what: "and leave with it", result: afterUnload === undefined ? "unbound ✓" : "still bound ✗" },
      { api: "AsyncModule + loadAsync()", what: "a module whose registration awaits", result: ok(afterAsyncLoad) },
      {
        api: "unloadAsync()",
        what: "async unload, awaiting deactivation",
        result: ok(await container.resolveOptionalAsync(asyncGreetingToken).then((v) => v ?? "unbound ✓")),
      },
      {
        api: "Container.fromModulesAsync()",
        what: "build a container straight from async modules",
        result: ok(fromModules.resolve(asyncGreetingToken)),
      },
      {
        api: "isSyncModule()",
        what: "tell the two module kinds apart",
        // The predicate returns its brand, so an async module reads `undefined` rather than `false`.
        result: `sync=${ok(isSyncModule(syncModule) === true)} async=${ok(isSyncModule(asyncModule) === true)}`,
      },
      {
        api: "loadAutoRegistered()",
        what: "register every class that opted in through its decorator",
        result: `${ok(registeredCount)} class → ${ok(autoContainer.resolve(AutoRegistered).label)}`,
      },
    ],
  };
}

/* ── Lifecycle hooks and async resolution ────────────────────────────────── */

async function tourLifecycle(): Promise<TourSection> {
  const container = Container.create();
  const serviceToken = token<{ name: string }>("service");
  const slowToken = token<string>("slow");
  const missingToken = token<string>("missing");
  const trail: Array<string> = [];

  container.bind(serviceToken).toConstantValue({ name: "raw" });
  container.onActivation(serviceToken, (_ctx, instance) => {
    trail.push("activated");

    return { name: `${instance.name}+decorated` };
  });
  container.onDeactivation(serviceToken, () => {
    trail.push("deactivated");
  });

  const activated = container.resolve(serviceToken).name;

  container.bind(slowToken).toDynamicAsync(async () => {
    await Promise.resolve();

    return "warmed";
  });
  await container.initializeAsync();

  const awaitedSlow = await container.resolveAsync(slowToken);
  const all = await container.resolveAllAsync(slowToken);
  const missingAsync = await container.resolveOptionalAsync(missingToken);

  await container.dispose();

  return {
    title: "Lifecycle and async resolution",
    blurb: "Container-level activation hooks, async warm-up, and the async resolve family.",
    rows: [
      { api: "onActivation()", what: "rewrite an instance on its way to the caller", result: ok(activated) },
      {
        api: "resolveAsync()",
        what: "await a binding that cannot answer synchronously",
        result: ok(awaitedSlow),
      },
      {
        api: "resolveOptionalAsync()",
        what: "async, and undefined instead of throwing",
        result: missingAsync === undefined ? "undefined for an unbound token ✓" : "unexpected value ✗",
      },
      { api: "resolveAllAsync()", what: "every match, awaited", result: ok(all.join(", ")) },
      {
        api: "initializeAsync()",
        what: "warm every async singleton up front",
        result: "warmed before first request ✓",
      },
      {
        api: "onDeactivation() + dispose()",
        what: "hooks fired while the container tears down",
        result: ok(trail.join(" → ")),
      },
    ],
  };
}

/* ── Registry mutation ───────────────────────────────────────────────────── */

async function tourRegistryMutation(): Promise<TourSection> {
  const container = Container.create();
  const first = token<string>("first");
  const second = token<string>("second");

  container.bind(first).toConstantValue("one");
  container.bind(second).toConstantValue("two");

  const id = container.lookupBindings(first)[0]?.id;

  await container.unbindAsync(second);
  const afterUnbindAsync = container.has(second);

  container.bind(second).toConstantValue("two again");
  container.unbindAll();
  const afterUnbindAll = container.has(first) || container.has(second);

  const scratch = Container.create();

  scratch.bind(first).toConstantValue("scratch");
  await scratch.unbindAllAsync();

  return {
    title: "Registry mutation",
    blurb: "Removing bindings one at a time or all at once, synchronously and with deactivation awaited.",
    rows: [
      { api: "lookupBindings()", what: "the binding identifiers behind one token", result: `id=${ok(id)}` },
      {
        api: "unbindAsync()",
        what: "remove one token, awaiting its deactivation",
        result: afterUnbindAsync ? "still bound ✗" : "unbound ✓",
      },
      { api: "unbindAll()", what: "empty the container", result: afterUnbindAll ? "something survived ✗" : "empty ✓" },
      {
        api: "unbindAllAsync()",
        what: "empty it, awaiting every deactivation",
        result: scratch.has(first) ? "still bound ✗" : "empty ✓",
      },
    ],
  };
}

/* ── Ambient container and property injection ────────────────────────────── */

const messageToken = token<string>("ambient-message");

class AmbientConsumer {
  @inject(messageToken) accessor message!: string;
}

function tourAmbientContainer(): TourSection {
  const container = Container.create();

  container.bind(messageToken).toConstantValue("resolved through the ambient container");

  const seenInside = runWithContainer(container, () => getActiveContainer() !== undefined);
  // The accessor resolves in the constructor, so construction has to happen inside the scope.
  const consumer = runWithContainer(container, () => new AmbientConsumer());

  return {
    title: "Ambient container",
    blurb: "`@inject` on an accessor resolves from whichever container is active while the instance is built.",
    rows: [
      {
        api: "runWithContainer()",
        what: "make a container ambient for one call",
        result: `active inside=${ok(seenInside)} outside=${ok(getActiveContainer() === undefined)}`,
      },
      { api: "@inject accessor", what: "property injection, no constructor parameter", result: ok(consumer.message) },
    ],
  };
}

/* ── Metadata reader and utilities ───────────────────────────────────────── */

function tourMetadataAndUtilities(): TourSection {
  const countingReader: MetadataReader = {
    getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
      return defaultMetadataReader.getConstructorMetadata(target);
    },
    getLifecycleMetadata(target: Constructor) {
      return defaultMetadataReader.getLifecycleMetadata(target);
    },
  };

  const container = Container.create({ metadataReader: countingReader });

  container.bind(Clock).toSelf().singleton();

  const readerToken = token<MetadataReader>("reader-binding");
  const viaToken = Container.create();

  viaToken.bind(MetadataReaderToken).toConstantValue(new SymbolMetadataReader());

  const someToken = token<string>("some");
  // `optional()` returns a plain descriptor; `inject()` returns a callable decorator, and reading
  // `.name` off that gives the function's name — so a plain one is what this helper wants.
  const descriptor = optional(someToken, { tag: ["tier", "gold"] });

  return {
    title: "Metadata readers and utilities",
    blurb: "Swapping how class metadata is read, and the small predicates and converters around tokens.",
    rows: [
      {
        api: "Container.create({ metadataReader })",
        what: "resolve a decorated class through a reader of your own",
        result: ok(container.resolve(Clock).startedAt),
      },
      {
        api: "MetadataReaderToken",
        what: "supply the reader as a binding instead",
        result: ok(viaToken.has(MetadataReaderToken)),
      },
      { api: "SymbolMetadataReader", what: "the reader behind Symbol.metadata", result: "instantiated ✓" },
      {
        api: "isToken() / tokenName()",
        what: "recognise a token and read its name",
        result: `${ok(isToken(someToken))} / ${ok(tokenName(someToken))}`,
      },
      {
        api: "isInjectionDescriptor()",
        what: "tell a descriptor from a bare token in a deps array",
        result: `descriptor=${ok(isInjectionDescriptor(descriptor))} token=${ok(isInjectionDescriptor(readerToken))}`,
      },
      {
        api: "injectionSlotToResolveOptions()",
        what: "the request a declared dependency turns into",
        result: JSON.stringify(injectionSlotToResolveOptions(descriptor) ?? {}),
      },
      {
        api: "bindingSlotToResolveOptions()",
        what: "the request that would select a given binding's slot",
        result: JSON.stringify(bindingSlotToResolveOptions({ tags: [["tier", "gold"]] }) ?? {}),
      },
    ],
  };
}

/* ── Error taxonomy ──────────────────────────────────────────────────────── */

/** The error class a mistake produces, which is the part a consumer has to branch on. */
const caught = (run: () => unknown): string => {
  try {
    run();
  } catch (error) {
    return error instanceof DiError ? `${error.constructor.name} (a DiError)` : String(error);
  }

  return "did not throw ✗";
};

async function tourErrors(): Promise<TourSection> {
  const unbound = token<string>("never-bound");
  const namedOnly = token<string>("named-only");
  const asyncOnly = token<string>("async-only");
  const left = token<string>("left");
  const right = token<string>("right");

  const container = Container.create();

  container.bind(namedOnly).toConstantValue("named").whenNamed("only");
  container.bind(asyncOnly).toDynamicAsync(async () => {
    await Promise.resolve();

    return "async";
  });
  container.bind(left).toDynamic((ctx) => ctx.resolve(right));
  container.bind(right).toDynamic((ctx) => ctx.resolve(left));

  const ambiguous = Container.create();

  ambiguous.bind(unbound).toConstantValue("by-fuel").whenTagged("fuel", "petrol");
  ambiguous.bind(unbound).toConstantValue("by-size").whenTagged("size", "v8");

  const captive = Container.create();
  const scopedLeaf = token<string>("scoped-leaf");
  const singletonRoot = token<string>("singleton-root");

  captive
    .bind(scopedLeaf)
    .toDynamic(() => "leaf")
    .scoped();
  captive
    .bind(singletonRoot)
    .toResolved((leaf: string) => leaf, [scopedLeaf])
    .singleton();

  const disposed = Container.create();

  disposed.bind(unbound).toConstantValue("gone");
  await disposed.dispose();

  return {
    title: "Error taxonomy",
    blurb: "Each mistake and the class it raises — every one of these extends `DiError`.",
    rows: [
      {
        api: "TokenNotBoundError",
        what: "resolve a token nothing ever bound",
        result: caught(() => container.resolve(unbound)),
      },
      {
        api: "NoMatchingBindingError",
        what: "token is bound, but no slot matches the request",
        result: caught(() => container.resolve(namedOnly)),
      },
      {
        api: "AmbiguousBindingError",
        what: "two candidates, equally specific, no predicate to separate them",
        result: caught(() =>
          ambiguous.resolve(unbound, {
            tags: [
              ["fuel", "petrol"],
              ["size", "v8"],
            ],
          }),
        ),
      },
      {
        api: "CircularDependencyError",
        what: "two dynamic bindings resolving each other",
        result: caught(() => container.resolve(left)),
      },
      {
        api: "AsyncResolutionError",
        what: "resolve a `toDynamicAsync` binding synchronously",
        result: caught(() => container.resolve(asyncOnly)),
      },
      {
        api: "DisposedContainerError",
        what: "resolve after the container was disposed",
        result: caught(() => disposed.resolve(unbound)),
      },
      {
        api: "RebindUnboundTokenError",
        what: "rebind a token that was never bound",
        result: caught(() => container.rebind(unbound)),
      },
      {
        api: "SelfBindingRequiresClassError",
        what: "`toSelf()` on a token rather than a class",
        result: caught(() => container.bind(token<string>("not-a-class")).toSelf()),
      },
      {
        api: "ScopeViolationError",
        what: "a singleton holding a scoped dependency captive, found by validate()",
        result: caught(() => {
          captive.validate();
        }),
      },
      {
        api: "MissingContainerContextError",
        what: "build an `@inject` accessor class with no ambient container",
        result: caught(() => new AmbientConsumer()),
      },
      {
        api: "not provoked here",
        what: "InternalError, InvalidMetadataError, MissingMetadataError, MissingScopeContextError, the three Async*Errors, ChainNotRegisteredError and SyncDisposalNotSupportedError need contrived or internal setups",
        result: "declared, not demonstrated",
      },
    ],
  };
}

/* ── Assembly ────────────────────────────────────────────────────────────── */

export async function buildFeatureTour(): Promise<FeatureTour> {
  const sections = [
    await tourBindingKinds(),
    tourSlotSelection(),
    tourContextualConstraints(),
    await tourModules(),
    await tourLifecycle(),
    await tourRegistryMutation(),
    tourAmbientContainer(),
    tourMetadataAndUtilities(),
    await tourErrors(),
  ];

  return {
    sections,
    apiCount: sections.reduce((total, section) => total + section.rows.length, 0),
  };
}

export const getFeatureTourServerFn = createServerFn().handler(async (): Promise<FeatureTour> => buildFeatureTour());
