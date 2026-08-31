/** Decorated fixtures the test-bed unit tests exercise. */

import { inject, injectable, injectAll, optional, postConstruct, preDestroy, tag, token } from "@codefast/di";

// ── Collaborator contracts ───────────────────────────────────────────────────────────────────────────────────────────

/** A record the fake user service returns. */
export interface UserRecord {
  readonly id: string;
  readonly email: string;
}

/** A collaborator that looks up users. */
export interface UserService {
  findUser(id: string): UserRecord | undefined;
}

/** A collaborator that charges a user. */
export interface PaymentGateway {
  charge(userId: string, amount: number): void;
}

/** A collaborator that sends email. */
export interface EmailService {
  send(to: string, body: string): void;
}

/** A collaborator that logs. */
export interface Logger {
  log(message: string): void;
}

/** A collaborator collected as a multi-binding. */
export interface Plugin {
  readonly name: string;
}

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────────

export const UserServiceToken = token<UserService>("UserService");
export const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway");
export const EmailServiceToken = token<EmailService>("EmailService");
export const LoggerToken = token<Logger>("Logger");
export const PluginToken = token<Plugin>("Plugin");

/** A tag key used to request a tagged binding. */
export const EnvTag = tag<string>("env");

/** A tag key whose values collide once stringified, exercising tag identity in slot handling. */
export const CollideTag = tag<unknown>("collide");

// ── Units under test ─────────────────────────────────────────────────────────────────────────────────────────────────

/** A multi-dependency unit whose collaborators are all constructor-injected. */
@injectable([UserServiceToken, PaymentGatewayToken, EmailServiceToken])
export class OrderProcessor {
  constructor(
    private readonly users: UserService,
    private readonly payments: PaymentGateway,
    private readonly email: EmailService,
  ) {}

  placeOrder(userId: string, amount: number): string {
    const user = this.users.findUser(userId);
    if (user === undefined) {
      throw new Error(`unknown user: ${userId}`);
    }
    this.payments.charge(userId, amount);
    this.email.send(user.email, `Order confirmed — ${String(amount)}`);
    return `ord-${userId}`;
  }
}

/** A unit with no dependencies. */
@injectable()
export class Standalone {
  ping(): string {
    return "pong";
  }
}

/** A class that is not `@injectable`, so its dependencies cannot be discovered. */
export class Undecorated {
  constructor(private readonly logger: Logger) {}

  greet(): void {
    this.logger.log("hi");
  }
}

/** A unit with an optional dependency and a multi dependency. */
@injectable([optional(LoggerToken), injectAll(PluginToken)])
export class ReportService {
  constructor(
    readonly logger: Logger | undefined,
    readonly plugins: Array<Plugin>,
  ) {}

  pluginCount(): number {
    return this.plugins.length;
  }
}

/** A unit that depends on the same token twice. */
@injectable([LoggerToken, LoggerToken])
export class DoubleLogger {
  constructor(
    readonly first: Logger,
    readonly second: Logger,
  ) {}
}

/** A unit whose sole dependency is requested by name. */
@injectable([inject(LoggerToken, { name: "primary" })])
export class NamedConsumer {
  constructor(readonly logger: Logger) {}
}

/** A unit whose sole dependency is requested with a tag. */
@injectable([inject(LoggerToken, { tag: EnvTag.of("prod") })])
export class TaggedConsumer {
  constructor(readonly logger: Logger) {}
}

/** A unit whose sole dependency is requested with a tag whose values stringify identically. */
@injectable([inject(LoggerToken, { tag: CollideTag.of(1) }), inject(LoggerToken, { tag: CollideTag.of("1") })])
export class CollidingTagConsumer {
  constructor(
    readonly first: Logger,
    readonly second: Logger,
  ) {}
}

/** A unit whose dependency is accessor-injected rather than constructor-injected. */
@injectable([])
export class AccessorConsumer {
  @inject(EmailServiceToken) accessor email!: EmailService;

  notify(to: string): void {
    this.email.send(to, "hello");
  }
}

/** An accessor-only unit with no `@injectable` at all — di resolves these through the zero-arg fallback. */
export class AccessorOnlyService {
  @inject(EmailServiceToken) accessor email!: EmailService;

  notify(to: string): void {
    this.email.send(to, "accessor-only");
  }
}

/** An undecorated zero-dependency class — resolvable without any metadata. */
export class PlainStandalone {
  ping(): string {
    return "plain";
  }
}

/** A unit whose `@postConstruct` always throws, exercising the failed-compile path. */
@injectable([LoggerToken])
export class ThrowingService {
  constructor(private readonly logger: Logger) {}

  @postConstruct()
  boot(): void {
    this.logger.log("boot");
    throw new Error("boot failed");
  }
}

/** A unit with lifecycle hooks that log through an injected collaborator. */
@injectable([LoggerToken])
export class LifecycleService {
  constructor(private readonly logger: Logger) {}

  @postConstruct()
  start(): void {
    this.logger.log("start");
  }

  @preDestroy()
  stop(): void {
    this.logger.log("stop");
  }
}
