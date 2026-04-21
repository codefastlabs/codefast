/**
 * Example 01 — Tokens & Basic Bindings
 *
 * Demonstrates the foundational pattern: type-safe tokens as keys,
 * the four primary binding strategies, and sync resolution.
 */

import { Container, token } from "@codefast/di";

// --- Tokens -----------------------------------------------------------------

const GreeterToken = token<Greeter>("Greeter");
const MessageToken = token<string>("Message");
const CounterToken = token<Counter>("Counter");

// --- Interfaces & classes ---------------------------------------------------

interface Greeter {
  greet(name: string): string;
}

class FormalGreeter implements Greeter {
  constructor(private readonly message: string) {}

  greet(name: string): string {
    return `${this.message}, ${name}.`;
  }
}

class Counter {
  private count = 0;

  increment(): number {
    return ++this.count;
  }

  value(): number {
    return this.count;
  }
}

// --- Container setup --------------------------------------------------------

const container = Container.create();

// 1. toConstantValue — fixed primitive
container.bind(MessageToken).toConstantValue("Good day");

// 2. toDynamic — sync factory; can resolve other tokens via ctx
container
  .bind(GreeterToken)
  .toDynamic((ctx) => {
    const message = ctx.resolve(MessageToken);
    return new FormalGreeter(message);
  })
  .singleton();

// 3. to(Constructor) — requires @injectable on the class (shown in 02-decorators)
//    Here we use toDynamic as an inline factory equivalent.
container
  .bind(CounterToken)
  .toDynamic(() => new Counter())
  .transient();

// --- Resolution -------------------------------------------------------------

const greeter = container.resolve(GreeterToken);
console.log(greeter.greet("Alice")); // Good day, Alice.
console.log(greeter.greet("Bob")); // Good day, Bob.

// Singleton: same instance on every resolve
const firstGreeter = container.resolve(GreeterToken);
const secondGreeter = container.resolve(GreeterToken);
console.log("Same greeter instance:", firstGreeter === secondGreeter); // true

// Transient: fresh instance on every resolve
const counterAlpha = container.resolve(CounterToken);
const counterBeta = container.resolve(CounterToken);
counterAlpha.increment();
console.log("counterAlpha count:", counterAlpha.value()); // 1
console.log("counterBeta count:", counterBeta.value()); // 0  (different instance)
console.log("Different counter instances:", counterAlpha !== counterBeta); // true

// resolveOptional — returns undefined instead of throwing for unbound tokens
const LogToken = token<string>("Log");
const log = container.resolveOptional(LogToken);
console.log("Optional unbound token:", log); // undefined

// has — existence check without resolution
console.log("has MessageToken:", container.has(MessageToken)); // true
console.log("has LogToken:", container.has(LogToken)); // false
