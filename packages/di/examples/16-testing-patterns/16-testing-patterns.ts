/**
 * Example 16 — Testing Patterns
 *
 * Shows how to write isolated, deterministic tests for code that uses the DI
 * container, without relying on a global shared container that leaks state.
 *
 * Patterns covered:
 * - Pattern A: Fresh container per test suite (zero shared state)
 * - Pattern B: rebind() to swap a real service for a stub mid-test
 * - Pattern C: Child container for test overrides (parent stays unchanged)
 * - Pattern D: Module-based setup + selective override
 * - Pattern E: container.validate() to catch wiring mistakes before runtime
 *
 * The "test framework" here is a minimal harness so the file runs with
 * plain `tsx` / `node`. In a real project replace suite()/test() with
 * describe()/it() from Vitest or Jest.
 */

import { Container, inject, injectable, Module, token } from "@codefast/di";

// ── Mini test harness ─────────────────────────────────────────────────────────

type TestFn = () => void | Promise<void>;
const results: Array<{ name: string; passed: boolean; error?: unknown }> = [];

async function test(name: string, fn: TestFn): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error });
    console.error(`  ✗ ${name}:`, error instanceof Error ? error.message : error);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ── Domain ────────────────────────────────────────────────────────────────────

const LoggerToken = token<Logger>("Logger");
const EmailServiceToken = token<EmailService>("EmailService");
const UserServiceToken = token<UserService>("UserService");
const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway");
const OrderServiceToken = token<OrderService>("OrderService");

interface Logger {
  messages: Array<string>;
  log(msg: string): void;
}

interface EmailService {
  sentEmails: Array<{ to: string; subject: string }>;
  send(to: string, subject: string): void;
}

interface UserService {
  findUser(id: string): { id: string; email: string } | undefined;
}

interface PaymentGateway {
  capturedPayments: Array<{ userId: string; amount: number }>;
  charge(userId: string, amount: number): { success: boolean; transactionId: string };
}

interface OrderService {
  placeOrder(userId: string, amount: number): { orderId: string; transactionId: string };
}

// ── Real implementations ───────────────────────────────────────────────────────

@injectable([])
class RealLogger implements Logger {
  messages: Array<string> = [];

  log(msg: string): void {
    this.messages.push(msg);
  }
}

@injectable([inject(LoggerToken)])
class SmtpEmailService implements EmailService {
  sentEmails: Array<{ to: string; subject: string }> = [];

  constructor(private readonly logger: Logger) {}

  send(to: string, subject: string): void {
    this.logger.log(`Sending "${subject}" to ${to}`);
    this.sentEmails.push({ to, subject });
  }
}

@injectable([inject(LoggerToken)])
class DatabaseUserService implements UserService {
  private readonly users = new Map([
    ["u1", { id: "u1", email: "alice@example.com" }],
    ["u2", { id: "u2", email: "bob@example.com" }],
  ]);

  constructor(private readonly logger: Logger) {}

  findUser(id: string): { id: string; email: string } | undefined {
    this.logger.log(`findUser(${id})`);
    return this.users.get(id);
  }
}

@injectable([inject(LoggerToken)])
class StripePaymentGateway implements PaymentGateway {
  capturedPayments: Array<{ userId: string; amount: number }> = [];

  constructor(private readonly logger: Logger) {}

  charge(userId: string, amount: number): { success: boolean; transactionId: string } {
    this.logger.log(`Charging $${amount} to user ${userId}`);
    this.capturedPayments.push({ userId, amount });
    return { success: true, transactionId: `txn-${Date.now()}` };
  }
}

@injectable([inject(UserServiceToken), inject(PaymentGatewayToken), inject(EmailServiceToken)])
class OrderProcessor implements OrderService {
  constructor(
    private readonly userService: UserService,
    private readonly paymentGateway: PaymentGateway,
    private readonly emailService: EmailService,
  ) {}

  placeOrder(userId: string, amount: number): { orderId: string; transactionId: string } {
    const user = this.userService.findUser(userId);
    if (user === undefined) {
      throw new Error(`User ${userId} not found`);
    }

    const payment = this.paymentGateway.charge(userId, amount);
    if (!payment.success) {
      throw new Error("Payment failed");
    }

    this.emailService.send(user.email, `Order confirmed — $${amount}`);
    return { orderId: `ord-${Date.now()}`, transactionId: payment.transactionId };
  }
}

// ── Stubs (for tests only) ────────────────────────────────────────────────────

class StubLogger implements Logger {
  messages: Array<string> = [];

  log(msg: string): void {
    this.messages.push(msg);
  }
}

class StubEmailService implements EmailService {
  sentEmails: Array<{ to: string; subject: string }> = [];

  send(to: string, subject: string): void {
    this.sentEmails.push({ to, subject });
  }
}

class StubUserService implements UserService {
  private readonly fixture = new Map<string, { id: string; email: string }>();

  seed(id: string, email: string): this {
    this.fixture.set(id, { id, email });
    return this;
  }

  findUser(id: string): { id: string; email: string } | undefined {
    return this.fixture.get(id);
  }
}

class StubPaymentGateway implements PaymentGateway {
  capturedPayments: Array<{ userId: string; amount: number }> = [];
  private shouldFail = false;

  failNextCharge(): this {
    this.shouldFail = true;
    return this;
  }

  charge(userId: string, amount: number): { success: boolean; transactionId: string } {
    if (this.shouldFail) {
      this.shouldFail = false;
      return { success: false, transactionId: "" };
    }
    this.capturedPayments.push({ userId, amount });
    return { success: true, transactionId: `stub-txn-${userId}-${amount}` };
  }
}

// ── Shared module (real infra) ────────────────────────────────────────────────

const CoreModule = Module.create("Core", (builder) => {
  builder.bind(LoggerToken).to(RealLogger).singleton();
  builder.bind(UserServiceToken).to(DatabaseUserService).singleton();
  builder.bind(PaymentGatewayToken).to(StripePaymentGateway).singleton();
  builder.bind(EmailServiceToken).to(SmtpEmailService).singleton();
  builder.bind(OrderServiceToken).to(OrderProcessor).singleton();
});

// ─────────────────────────────────────────────────────────────────────────────
// Pattern A — Fresh container per test
//
// Safest isolation: each test builds its own container from scratch.
// No shared state, no teardown needed.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Pattern A: Fresh container per test ===");

await test("places order and sends confirmation email", async () => {
  const stubUser = new StubUserService().seed("u1", "alice@example.com");
  const stubPayment = new StubPaymentGateway();
  const stubEmail = new StubEmailService();

  const testContainer = Container.create();
  testContainer.bind(LoggerToken).to(StubLogger).singleton();
  testContainer.bind(UserServiceToken).toConstantValue(stubUser);
  testContainer.bind(PaymentGatewayToken).toConstantValue(stubPayment);
  testContainer.bind(EmailServiceToken).toConstantValue(stubEmail);
  testContainer.bind(OrderServiceToken).to(OrderProcessor).singleton();

  const orderService = testContainer.resolve(OrderServiceToken);
  const orderResult = orderService.placeOrder("u1", 49.99);

  assert(orderResult.orderId.startsWith("ord-"), "orderId should have ord- prefix");
  assert(orderResult.transactionId.startsWith("stub-txn-"), "transactionId should come from stub");
  assert(stubPayment.capturedPayments.length === 1, "payment captured once");
  assert(stubPayment.capturedPayments[0]?.amount === 49.99, "correct amount charged");
  assert(stubEmail.sentEmails.length === 1, "one email sent");
  assert(stubEmail.sentEmails[0]?.to === "alice@example.com", "email sent to correct address");
});

await test("throws when user is not found", async () => {
  const testContainer = Container.create();
  testContainer.bind(LoggerToken).to(StubLogger).singleton();
  testContainer.bind(UserServiceToken).toConstantValue(new StubUserService()); // empty — no users
  testContainer.bind(PaymentGatewayToken).toConstantValue(new StubPaymentGateway());
  testContainer.bind(EmailServiceToken).toConstantValue(new StubEmailService());
  testContainer.bind(OrderServiceToken).to(OrderProcessor).singleton();

  const orderService = testContainer.resolve(OrderServiceToken);

  let threw = false;
  try {
    orderService.placeOrder("unknown", 10);
  } catch {
    threw = true;
  }
  assert(threw, "should throw for unknown user");
});

// ─────────────────────────────────────────────────────────────────────────────
// Pattern B — rebind() to swap a single binding mid-test
//
// Start from a fully-wired container, then override only what you need.
// rebind() atomically removes all existing bindings for the token before
// adding the new one, so stale bindings cannot leak into the test.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Pattern B: rebind() for targeted override ===");

await test("payment failure causes placeOrder to throw", async () => {
  const testContainer = Container.fromModules(CoreModule);

  // Swap only the payment gateway — everything else stays real.
  const stubPayment = new StubPaymentGateway().failNextCharge();
  testContainer.rebind(PaymentGatewayToken).toConstantValue(stubPayment);
  testContainer
    .rebind(UserServiceToken)
    .toConstantValue(new StubUserService().seed("u1", "alice@example.com"));

  const orderService = testContainer.resolve(OrderServiceToken);

  let threw = false;
  try {
    orderService.placeOrder("u1", 99);
  } catch {
    threw = true;
  }
  assert(threw, "should throw when payment gateway fails");
  assert(stubPayment.capturedPayments.length === 0, "no payment captured on failure");
});

// ─────────────────────────────────────────────────────────────────────────────
// Pattern C — Child container for test overrides
//
// The parent holds the production wiring; each test creates a child that
// shadows specific tokens. The parent is never mutated.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Pattern C: child container override ===");

// Production container — built once, never touched by tests.
const productionContainer = Container.fromModules(CoreModule);

await test("child container shadows PaymentGateway without mutating parent", async () => {
  const stubPayment = new StubPaymentGateway();
  const stubUser = new StubUserService().seed("u2", "bob@example.com");
  const stubEmail = new StubEmailService();

  const testChildContainer = productionContainer.createChild();
  testChildContainer.bind(UserServiceToken).toConstantValue(stubUser);
  testChildContainer.bind(PaymentGatewayToken).toConstantValue(stubPayment);
  testChildContainer.bind(EmailServiceToken).toConstantValue(stubEmail);
  testChildContainer.bind(OrderServiceToken).to(OrderProcessor).singleton();

  const orderService = testChildContainer.resolve(OrderServiceToken);
  orderService.placeOrder("u2", 25.0);

  assert(stubPayment.capturedPayments.length === 1, "child stub captured payment");

  // Parent's payment gateway is still the real Stripe one.
  const parentBindings = productionContainer.lookupBindings(PaymentGatewayToken);
  assert(parentBindings[0]?.kind === "class", "parent still holds real class binding");
});

await test("two independent child containers do not share state", async () => {
  const childAPayment = new StubPaymentGateway();
  const childBPayment = new StubPaymentGateway();

  const childAContainer = productionContainer.createChild();
  childAContainer
    .bind(UserServiceToken)
    .toConstantValue(new StubUserService().seed("u1", "alice@example.com"));
  childAContainer.bind(PaymentGatewayToken).toConstantValue(childAPayment);
  childAContainer.bind(EmailServiceToken).toConstantValue(new StubEmailService());
  childAContainer.bind(OrderServiceToken).to(OrderProcessor).singleton();

  const childBContainer = productionContainer.createChild();
  childBContainer
    .bind(UserServiceToken)
    .toConstantValue(new StubUserService().seed("u1", "alice@example.com"));
  childBContainer.bind(PaymentGatewayToken).toConstantValue(childBPayment);
  childBContainer.bind(EmailServiceToken).toConstantValue(new StubEmailService());
  childBContainer.bind(OrderServiceToken).to(OrderProcessor).singleton();

  childAContainer.resolve(OrderServiceToken).placeOrder("u1", 10);
  childBContainer.resolve(OrderServiceToken).placeOrder("u1", 20);

  assert(childAPayment.capturedPayments.length === 1, "child A has 1 payment");
  assert(childBPayment.capturedPayments.length === 1, "child B has 1 payment");
  assert(childAPayment.capturedPayments[0]?.amount === 10, "child A charged correct amount");
  assert(childBPayment.capturedPayments[0]?.amount === 20, "child B charged correct amount");
});

// ─────────────────────────────────────────────────────────────────────────────
// Pattern D — Factory helper that loads CoreModule then rebinds stubs
//
// ModuleBuilder only exposes bind() and import() — rebind() lives on Container.
// The pattern: load the production module first, then call container.rebind()
// for each stub. This is cleaner than a separate override module.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Pattern D: factory helper with rebind ===");

function buildTestContainer(
  stubUser: StubUserService,
  stubPayment: StubPaymentGateway,
): { container: ReturnType<typeof Container.create>; stubEmail: StubEmailService } {
  const stubEmail = new StubEmailService();
  const testContainer = Container.fromModules(CoreModule);
  testContainer.rebind(UserServiceToken).toConstantValue(stubUser);
  testContainer.rebind(PaymentGatewayToken).toConstantValue(stubPayment);
  testContainer.rebind(EmailServiceToken).toConstantValue(stubEmail);
  return { container: testContainer, stubEmail };
}

await test("module override replaces all three stubs", async () => {
  const stubUser = new StubUserService().seed("u1", "alice@example.com");
  const stubPayment = new StubPaymentGateway();
  const { container: testContainer, stubEmail } = buildTestContainer(stubUser, stubPayment);

  const orderService = testContainer.resolve(OrderServiceToken);
  orderService.placeOrder("u1", 75);

  assert(stubPayment.capturedPayments[0]?.amount === 75, "correct amount charged via stub");
  assert(stubEmail.sentEmails[0]?.to === "alice@example.com", "email sent via stub");
});

// ─────────────────────────────────────────────────────────────────────────────
// Pattern E — container.validate() to catch wiring mistakes early
//
// validate() walks the binding graph and throws if a dependency cannot be
// resolved. Call it at the start of your integration test suite or at app
// startup to surface missing / mismatched bindings before the first request.
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n=== Pattern E: validate() for wiring checks ===");

await test("validate passes on a correctly wired container", async () => {
  const testContainer = Container.fromModules(CoreModule);
  testContainer.validate(); // throws if any binding is broken
  assert(true, "validate() passed without throwing");
});

await test("incomplete container is detected by inspect() before validate()", async () => {
  const testContainer = Container.create();
  testContainer.bind(OrderServiceToken).to(OrderProcessor).singleton();
  // Intentionally missing: Logger, UserService, PaymentGateway, EmailService

  const snapshot = testContainer.inspect();
  const hasLogger = testContainer.has(LoggerToken);
  const hasUser = testContainer.has(UserServiceToken);

  assert(!hasLogger, "LoggerToken should be missing");
  assert(!hasUser, "UserServiceToken should be missing");
  assert(snapshot.ownBindings.length === 1, "only OrderService is bound");
});

// ── Summary ───────────────────────────────────────────────────────────────────

const passed = results.filter((testResult) => testResult.passed).length;
const failed = results.filter((testResult) => !testResult.passed).length;
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
