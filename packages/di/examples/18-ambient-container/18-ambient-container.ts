/**
 * Example 18 — Ambient Container & Property Injection
 *
 * Shows the container context that `@inject()` accessor fields read while they initialize, and
 * how to open that context by hand for instances the container does not construct.
 *
 * Covers:
 * - @inject() accessor           → property injection instead of constructor parameters
 * - @inject(Token, { name })     → a named slot on an accessor
 * - getActiveContainer()         → the container currently constructing, or undefined
 * - runWithContainer()           → open a context around code that constructs by hand
 * - MissingContainerContextError → what an accessor throws with no context open
 */

import {
  Container,
  getActiveContainer,
  inject,
  injectable,
  MissingContainerContextError,
  postConstruct,
  runWithContainer,
  token,
} from "@codefast/di";

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const ClockToken = token<Clock>("Clock");
const TransportToken = token<Transport>("Transport");
const RequestIdToken = token<string>("RequestId");

// ── Interfaces ───────────────────────────────────────────────────────────────────────────────────────────────────────

interface Clock {
  now(): string;
}

interface Transport {
  send(message: string): void;
}

// ── Implementations ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Constructor injection only, so the container never opens a context for it.
 *
 * @remarks The probe here is the point: the context costs a try/finally per instantiation, so the
 * resolver opens it only for classes whose metadata declares accessor injection.
 */
@injectable([])
class Stopwatch {
  readonly sawContext = getActiveContainer() !== undefined;
}

@injectable([])
class Notifier {
  @inject(ClockToken) accessor clock!: Clock;
  @inject(TransportToken, { name: "email" }) accessor email!: Transport;
  @inject(TransportToken, { name: "sms" }) accessor sms!: Transport;

  readonly sawContext = getActiveContainer() !== undefined;
  contextDuringPostConstruct = false;

  @postConstruct()
  recordContext(): void {
    this.contextDuringPostConstruct = getActiveContainer() !== undefined;
  }

  notify(message: string): void {
    this.email.send(`[${this.clock.now()}] ${message}`);
    this.sms.send(message);
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = Container.create();

container.bind(ClockToken).toConstantValue({ now: () => "2026-08-01T09:00:00Z" });
container
  .bind(TransportToken)
  .toConstantValue({ send: (message) => console.log(`  email → ${message}`) })
  .whenNamed("email");
container
  .bind(TransportToken)
  .toConstantValue({ send: (message) => console.log(`  sms   → ${message}`) })
  .whenNamed("sms");
container.bind(Stopwatch).toSelf().transient();
container.bind(Notifier).toSelf().transient();

// ─────────────────────────────────────────────────────────────────────────────
// 1. Property injection through resolve() — the normal path
//    The resolver opens the context, each accessor initializer resolves into it.
// ─────────────────────────────────────────────────────────────────────────────

console.log("=== 1. Accessor injection via resolve() ===");

const notifier = container.resolve(Notifier);

notifier.notify("deploy finished");
console.log("clock accessor:", notifier.clock.now());

// ─────────────────────────────────────────────────────────────────────────────
// 2. The context is not global — it is opened per instantiation, and only when
//    the class actually needs it.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 2. Who sees a context ===");

console.log("at module scope:                 ", getActiveContainer());
console.log("Stopwatch (constructor only):    ", container.resolve(Stopwatch).sawContext);
console.log("Notifier (accessor injection):   ", notifier.sawContext);
console.log("Notifier during @postConstruct:  ", notifier.contextDuringPostConstruct);

// @postConstruct runs after construction returns, so the context has already closed — the
// accessors are set by then, which is what the hook actually needs.

// ── 3. Constructing by hand with no context open ─────────────────────────────────────────────────────────────────────

console.log("\n=== 3. new Notifier() with no context ===");

try {
  const escaped = new Notifier();

  console.log("unreachable", escaped);
} catch (error) {
  if (error instanceof MissingContainerContextError) {
    console.log("code:        ", error.code);
    console.log("className:   ", error.className);
    console.log("accessorName:", error.accessorName);
    console.log("message:     ", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. runWithContainer() — the bridge for objects someone else constructs
//    A router, an ORM, or a test helper hands you the `new`; wrap its call site.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 4. runWithContainer() bridge ===");

function instantiateAsFramework<Value>(ctor: new () => Value): Value {
  return runWithContainer(container, () => new ctor());
}

const bridged = instantiateAsFramework(Notifier);

bridged.notify("built outside the container");

// Only accessor injection is bridged. Lifecycle hooks belong to the resolver, so a hand-built
// instance never runs @postConstruct — and the container will not dispose it either.
console.log("@postConstruct ran:", bridged.contextDuringPostConstruct);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Nested contexts — a per-request child shadows the root, then restores
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 5. Nested contexts ===");

const requestContainer = container.createChild();

requestContainer.bind(RequestIdToken).toConstantValue("req-42");
requestContainer.bind(TransportToken).toConstantValue({ send: (message) => console.log(`  audit → ${message}`) });

runWithContainer(container, () => {
  console.log("outer is root:  ", getActiveContainer() === container);

  runWithContainer(requestContainer, () => {
    console.log("inner is child: ", getActiveContainer() === requestContainer);
    console.log("child resolves: ", getActiveContainer()?.resolve(RequestIdToken));
  });

  console.log("restored to root:", getActiveContainer() === container);
});

console.log("after the block: ", getActiveContainer());

// ─────────────────────────────────────────────────────────────────────────────
// 6. Reading the context from plain code — an escape hatch, guarded
//    Prefer constructor injection; this is for helpers that cannot take a container.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== 6. Guarded ambient lookup ===");

function currentRequestId(): string {
  return getActiveContainer()?.resolveOptional(RequestIdToken) ?? "no-request";
}

console.log("outside any context:", currentRequestId());
console.log(
  "inside the request: ",
  runWithContainer(requestContainer, () => currentRequestId()),
);
