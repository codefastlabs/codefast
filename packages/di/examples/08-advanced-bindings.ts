/**
 * Example 08 — Advanced Bindings
 *
 * Covers the binding strategies and management patterns missing from earlier examples:
 * - toResolved: typed deps array, no ctx object needed
 * - toAlias: redirect one token to another
 * - BindingIdentifier + .id(): targeted unbind in multi-binding
 * - rebind(): replace a binding atomically
 * - Plain tokens directly in @injectable (no inject() wrapper needed)
 */

import { Container, inject, injectable, optional, singleton, token } from "@codefast/di";

// --- Tokens -----------------------------------------------------------------

const LoggerToken = token<Logger>("Logger");
const AbstractLoggerToken = token<Logger>("AbstractLogger");
const ConfigToken = token<Config>("Config");
const MailerToken = token<Mailer>("Mailer");
const NotifierToken = token<Notifier>("Notifier");
const PluginToken = token<Plugin>("Plugin");

// --- Types ------------------------------------------------------------------

interface Logger {
  log(msg: string): void;
}

interface Config {
  smtpHost: string;
  env: "development" | "production";
}

interface Mailer {
  send(to: string, subject: string): void;
}

interface Notifier {
  notify(msg: string): void;
}

interface Plugin {
  name: string;
  run(): void;
}

// --- Implementations --------------------------------------------------------

class ConsoleLogger implements Logger {
  log(msg: string): void {
    console.log(`[console] ${msg}`);
  }
}

class FileLogger implements Logger {
  log(msg: string): void {
    console.log(`[file] ${msg}`);
  }
}

class SmtpMailer implements Mailer {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  send(to: string, subject: string): void {
    this.logger.log(`Sending "${subject}" to ${to} via ${this.config.smtpHost}`);
  }
}

// ============================================================================
// 1. toResolved — typed deps array, no ctx object
//
//    Use when deps are simple tokens; cleaner than toDynamic for this case.
//    TypeScript infers factory param types from the deps array automatically.
// ============================================================================

const container = Container.create();

container.bind(LoggerToken).toConstantValue(new ConsoleLogger());
container.bind(ConfigToken).toConstantValue({ smtpHost: "smtp.example.com", env: "development" });

// toResolved: factory + deps array — no ctx, no manual resolve()
container.bind(MailerToken).toResolved(
  (logger, config) => new SmtpMailer(logger, config),
  // `as const` tells TypeScript to treat the array as a tuple so it can
  // infer each factory parameter's type individually.
  [LoggerToken, ConfigToken] as const,
);

const mailer = container.resolve(MailerToken);
mailer.send("alice@example.com", "Hello");

// ============================================================================
// 2. toAlias — redirect token A → token B
//
//    AbstractLoggerToken resolves to whatever LoggerToken resolves to.
//    Useful for interface tokens that map to concrete singleton tokens.
// ============================================================================

container.bind(AbstractLoggerToken).toAlias(LoggerToken);

const concreteLogger = container.resolve(LoggerToken);
const aliasedLogger = container.resolve(AbstractLoggerToken);
console.log("toAlias — same instance:", concreteLogger === aliasedLogger); // true

// ============================================================================
// 3. Plain tokens in @injectable — no inject() wrapper required
//
//    When you don't need named/tagged injection, pass tokens or constructors
//    directly in the deps array. inject() is only needed for name/tag options.
// ============================================================================

// Plain tokens — no inject() wrapper
@injectable([LoggerToken, ConfigToken])
@singleton()
class PlainNotifier implements Notifier {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  notify(msg: string): void {
    this.logger.log(`[${this.config.env}] ${msg}`);
  }
}

// Mixed: plain token + inject() with options + optional()
@injectable([LoggerToken, inject(ConfigToken), optional(NotifierToken)])
class MixedService {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
    private readonly notifier?: Notifier,
  ) {}

  run(): void {
    this.logger.log(`MixedService running in ${this.config.env}`);
    this.notifier?.notify("MixedService started");
  }
}

const MixedServiceToken = token<MixedService>("MixedService");
container.bind(MixedServiceToken).to(MixedService);
container.bind(NotifierToken).to(PlainNotifier);
const notifier = container.resolve(NotifierToken);
notifier.notify("system ready");

// ============================================================================
// 4. BindingIdentifier + .id() — targeted unbind in multi-binding
//
//    When multiple bindings share a token, .id() lets you remove a specific
//    one without touching the others.
// ============================================================================

const pluginContainer = Container.create();

// Register three plugins — each bind() returns a BindingBuilder with .id()
const logPluginId = pluginContainer
  .bind(PluginToken)
  .toConstantValue({ name: "log", run: () => console.log("[LogPlugin] running") })
  .id();

const metricsPluginId = pluginContainer
  .bind(PluginToken)
  .toConstantValue({ name: "metrics", run: () => console.log("[MetricsPlugin] running") })
  .id();

pluginContainer
  .bind(PluginToken)
  .toConstantValue({ name: "audit", run: () => console.log("[AuditPlugin] running") });

console.log("\n--- All plugins ---");
const allPlugins = pluginContainer.resolveAll(PluginToken);
console.log("Count:", allPlugins.length); // 3
allPlugins.forEach((p) => p.run());

// Remove only the metrics plugin — other bindings unaffected
pluginContainer.unbind(metricsPluginId);

console.log("\n--- After unbinding MetricsPlugin ---");
const remainingPlugins = pluginContainer.resolveAll(PluginToken);
console.log("Count:", remainingPlugins.length); // 2
remainingPlugins.forEach((p) => p.run());

// Remove the log plugin by its specific id — audit plugin still intact
pluginContainer.unbind(logPluginId);

console.log("\n--- After unbinding LogPlugin ---");
const finalPlugins = pluginContainer.resolveAll(PluginToken);
console.log("Count:", finalPlugins.length); // 1
finalPlugins.forEach((p) => p.run());

// ============================================================================
// 5. rebind() — atomically replace a binding
//
//    rebind() unbinds all existing bindings for the token, then returns a
//    fresh BindingBuilder. Useful for overriding in tests or hot-reload.
// ============================================================================

console.log("\n--- rebind: swap logger ---");
const rebindContainer = Container.create();
rebindContainer.bind(LoggerToken).toConstantValue(new ConsoleLogger());

const logBefore = rebindContainer.resolve(LoggerToken);
logBefore.log("before rebind");

// Atomically swap to FileLogger
rebindContainer.rebind(LoggerToken).toConstantValue(new FileLogger());

const logAfter = rebindContainer.resolve(LoggerToken);
logAfter.log("after rebind");
console.log("Different instance after rebind:", logBefore !== logAfter); // true
