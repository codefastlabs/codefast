/**
 * Example 04 — Modules
 *
 * Modules let you organise bindings into cohesive, reusable units.
 * They deduplicate automatically — loading the same module twice
 * (including diamond imports) runs setup only once.
 */

import { Container, inject, injectable, Module, token } from "@codefast/di";

// --- Tokens -----------------------------------------------------------------

const ConfigToken = token<Config>("Config");
const LoggerToken = token<Logger>("Logger");
const EmailServiceToken = token<EmailService>("EmailService");
const AuthServiceToken = token<AuthService>("AuthService");
const AppToken = token<App>("App");

// --- Types ------------------------------------------------------------------

interface Config {
  smtpHost: string;
  jwtSecret: string;
}

interface Logger {
  info(msg: string): void;
  error(msg: string): void;
}

// --- Implementations --------------------------------------------------------

@injectable([inject(ConfigToken), inject(LoggerToken)])
class EmailService {
  constructor(
    private readonly config: Config,
    private readonly logger: Logger,
  ) {}

  send(to: string, subject: string): void {
    this.logger.info(`Sending "${subject}" to ${to} via ${this.config.smtpHost}`);
  }
}

@injectable([inject(ConfigToken), inject(LoggerToken)])
class AuthService {
  constructor(
    private readonly config: Config,
    private readonly logger: Logger,
  ) {}

  issueToken(userId: string): string {
    this.logger.info(`Issuing JWT for ${userId}`);
    return `jwt.${userId}.${this.config.jwtSecret.slice(0, 4)}`;
  }
}

@injectable([inject(EmailServiceToken), inject(AuthServiceToken)])
class App {
  constructor(
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {}

  register(userId: string, email: string): string {
    const jwtToken = this.authService.issueToken(userId);
    this.emailService.send(email, "Welcome!");
    return jwtToken;
  }
}

// --- Modules ----------------------------------------------------------------

// CoreModule: shared primitives (config + logger) — can be imported by others
const CoreModule = Module.create("Core", (builder) => {
  builder.bind(ConfigToken).toConstantValue({
    smtpHost: "smtp.example.com",
    jwtSecret: "supersecret",
  });

  builder.bind(LoggerToken).toConstantValue({
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
  });
});

// EmailModule: depends on CoreModule
const EmailModule = Module.create("Email", (builder) => {
  builder.import(CoreModule); // declares dependency
  builder.bind(EmailServiceToken).to(EmailService).singleton();
});

// AuthModule: also depends on CoreModule
const AuthModule = Module.create("Auth", (builder) => {
  builder.import(CoreModule); // CoreModule deduped — setup runs only once
  builder.bind(AuthServiceToken).to(AuthService).singleton();
});

// AppModule: composes all above — CoreModule imported 3 times, runs once
const AppModule = Module.create("App", (builder) => {
  builder.import(CoreModule, EmailModule, AuthModule);
  builder.bind(AppToken).to(App);
});

// --- Bootstrap --------------------------------------------------------------

const container = Container.fromModules(AppModule);

const app = container.resolve(AppToken);
const jwtToken = app.register("user-1", "alice@example.com");
console.log("JWT:", jwtToken);

// EmailService and AuthService share the SAME Logger singleton
const emailService = container.resolve(EmailServiceToken);
const authService = container.resolve(AuthServiceToken);
emailService.send("bob@example.com", "Welcome");
authService.issueToken("user-2");
const firstLoggerResolve = container.resolve(LoggerToken);
const secondLoggerResolve = container.resolve(LoggerToken);
console.log("Shared Logger:", firstLoggerResolve === secondLoggerResolve); // true

// You can also load/unload modules dynamically after container creation
const ExtraModule = Module.create("Extra", (builder) => {
  const ExtraToken = token<string>("Extra");
  builder.bind(ExtraToken).toConstantValue("extra-value");
});

container.load(ExtraModule);
console.log("Module loaded dynamically");

container.unload(ExtraModule);
console.log("Module unloaded");

// Introspect: see all active bindings
const containerSnapshot = container.inspect();
console.log("Active binding count:", containerSnapshot.ownBindings.length);
