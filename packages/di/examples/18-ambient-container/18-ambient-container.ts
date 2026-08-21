/**
 * Example 18 — Ambient Container & Property Injection
 *
 * Shows the container context that `@inject()` accessor fields read while they initialize, and
 * how to open that context by hand for instances the container does not construct.
 *
 * Covers:
 * - `@inject()` accessor           → property injection instead of constructor parameters
 * - `@inject(Token, { name })`     → a named slot on an accessor
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

import { item, section } from "#/examples/support/log";

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

section("1. Accessor injection via resolve()");

const notifier = container.resolve(Notifier);

notifier.notify("deploy finished");
item("clock accessor", notifier.clock.now());

// ─────────────────────────────────────────────────────────────────────────────
// 2. The context is not global — it is opened per instantiation, and only when
//    the class actually needs it.
// ─────────────────────────────────────────────────────────────────────────────

section("2. Who sees a context");

item("at module scope", getActiveContainer());
item("Stopwatch (constructor only)", container.resolve(Stopwatch).sawContext);
item("Notifier (accessor injection)", notifier.sawContext);
item("Notifier during @postConstruct", notifier.contextDuringPostConstruct);

// @postConstruct runs after construction returns, so the context has already closed — the
// accessors are set by then, which is what the hook actually needs.

// ── 3. Constructing by hand with no context open ─────────────────────────────────────────────────────────────────────

section("3. new Notifier() with no context");

try {
  const escaped = new Notifier();

  console.log("unreachable", escaped);
} catch (error) {
  if (error instanceof MissingContainerContextError) {
    item("code", error.code);
    item("className", error.className);
    item("accessorName", error.accessorName);
    item("message", error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. runWithContainer() — the bridge for objects someone else constructs
//    A router, an ORM, or a test helper hands you the `new`; wrap its call site.
// ─────────────────────────────────────────────────────────────────────────────

section("4. runWithContainer() bridge");

function instantiateAsFramework<Value>(ctor: new () => Value): Value {
  return runWithContainer(container, () => new ctor());
}

const bridged = instantiateAsFramework(Notifier);

bridged.notify("built outside the container");

// Only accessor injection is bridged. Lifecycle hooks belong to the resolver, so a hand-built
// instance never runs @postConstruct — and the container will not dispose it either.
item("@postConstruct ran", bridged.contextDuringPostConstruct);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Nested contexts — a per-request child shadows the root, then restores
// ─────────────────────────────────────────────────────────────────────────────

section("5. Nested contexts");

const requestContainer = container.createChild();

requestContainer.bind(RequestIdToken).toConstantValue("req-42");
requestContainer.bind(TransportToken).toConstantValue({ send: (message) => console.log(`  audit → ${message}`) });

runWithContainer(container, () => {
  item("outer is root", getActiveContainer() === container);

  runWithContainer(requestContainer, () => {
    item("inner is child", getActiveContainer() === requestContainer);
    item("child resolves", getActiveContainer()?.resolve(RequestIdToken));
  });

  item("restored to root", getActiveContainer() === container);
});

item("after the block", getActiveContainer());

// ─────────────────────────────────────────────────────────────────────────────
// 6. Reading the context from plain code — an escape hatch, guarded
//    Prefer constructor injection; this is for helpers that cannot take a container.
// ─────────────────────────────────────────────────────────────────────────────

section("6. Guarded ambient lookup");

function currentRequestId(): string {
  return getActiveContainer()?.resolveOptional(RequestIdToken) ?? "no-request";
}

item("outside any context", currentRequestId());
item(
  "inside the request",
  runWithContainer(requestContainer, () => currentRequestId()),
);
