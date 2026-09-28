/**
 * The program a consumer ships, run by every lane against the built package: each decorator, and the order the spec
 * promises between them.
 */
import { Container, inject, injectable, postConstruct, preDestroy, token } from "@codefast/di";

// Module-scoped, so the lanes that load no host types still compile; the runtime's own `console` is what runs.
declare const console: { log(line: string): void };

const Greeting = token<string>("e2e:Greeting");
const Shout = token<string>("e2e:Shout");
const Log = token<Array<string>>("e2e:Log");

@injectable([Greeting])
class Greeter {
  @inject(Log) accessor log!: Array<string>;

  // Declared after the accessor, so it reads the injected value.
  readonly logSeenByField: Array<string> = this.log;

  readonly greeting: string;

  constructor(greeting: string) {
    this.greeting = greeting;
    this.log.push(`constructor:${greeting}`);
  }

  @postConstruct()
  init(): void {
    this.log.push(`init:${this.constructor.name}`);
  }

  @preDestroy()
  close(): void {
    this.log.push(`close:${this.constructor.name}`);
  }
}

@injectable([Greeting])
class LoudGreeter extends Greeter {
  @inject(Shout) accessor shout!: string;

  constructor(greeting: string) {
    super(greeting);
    this.log.push(`constructor:${this.shout}`);
  }
}

/** Resolves both classes, disposes the container, and prints what happened as one JSON line. */
export async function run(): Promise<void> {
  const log: Array<string> = [];
  const container = Container.create();
  container.bind(Greeting).toConstantValue("hello");
  container.bind(Shout).toConstantValue("HELLO");
  container.bind(Log).toConstantValue(log);
  container.bind(Greeter).toSelf().singleton();
  container.bind(LoudGreeter).toSelf().singleton();

  const greeter = container.resolve(Greeter);
  const loud = container.resolve(LoudGreeter);
  await container.dispose();

  console.log(
    JSON.stringify({ fieldSawInjection: greeter.logSeenByField === log && loud.logSeenByField === log, log }),
  );
}
