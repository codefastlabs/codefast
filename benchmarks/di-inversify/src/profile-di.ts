// Where resolve time actually goes, on the shapes whose ratio against inversify is thinnest.
// @ts-nocheck
import { Container, injectable, token } from "@codefast/di";

const SHAPE = process.env.SHAPE ?? "realistic";
const ITERATIONS = Number(process.env.ITERATIONS ?? 300_000);

function buildTransientChain(depth) {
  const container = Container.create();
  const tokens = [];
  for (let level = 0; level < depth; level += 1) {
    tokens.push(token(`chain-${level}`));
  }

  container.bind(tokens[depth - 1]).toResolved(() => ({ level: depth - 1 }), []);
  for (let level = depth - 2; level >= 0; level -= 1) {
    container.bind(tokens[level]).toResolved((next) => ({ level, next }), [tokens[level + 1]]);
  }
  return { container, root: tokens[0] };
}

function buildFanOutTree(breadth, depth) {
  const container = Container.create();
  let previous = [];
  for (let level = depth; level >= 0; level -= 1) {
    const current = [];
    const width = level === 0 ? 1 : breadth ** level;
    for (let index = 0; index < width; index += 1) {
      const nodeToken = token(`node-${level}-${index}`);
      const children = previous.slice(index * breadth, index * breadth + breadth);
      container.bind(nodeToken).toResolved((...kids) => ({ level, kids }), children);
      current.push(nodeToken);
    }
    previous = current;
  }
  return { container, root: previous[0] };
}

function buildRealisticGraph() {
  @injectable([])
  class Config {}
  @injectable([Config])
  class Logger {
    constructor(config) {
      this.config = config;
    }
  }
  @injectable([Config])
  class Pool {
    constructor(config) {
      this.config = config;
    }
  }
  @injectable([Pool, Logger])
  class Repo {
    constructor(pool, logger) {
      this.pool = pool;
      this.logger = logger;
    }
  }
  @injectable([Repo, Logger])
  class Service {
    constructor(repo, logger) {
      this.repo = repo;
      this.logger = logger;
    }
  }

  const container = Container.create();
  container.bind(Config).toSelf().singleton();
  container.bind(Logger).toSelf().singleton();
  container.bind(Pool).toSelf().singleton();
  container.bind(Repo).toSelf();
  container.bind(Service).toSelf();
  return { container, root: Service };
}

const SHAPES = {
  chain32: () => buildTransientChain(32),
  chain512: () => buildTransientChain(512),
  fanout: () => buildFanOutTree(4, 3),
  realistic: () => buildRealisticGraph(),
};

const { container, root } = SHAPES[SHAPE]();

// Warm, so the profile is steady-state rather than the first-hop compile.
for (let index = 0; index < 20_000; index += 1) {
  container.resolve(root);
}

const startedAt = performance.now();
let sink = 0;
for (let index = 0; index < ITERATIONS; index += 1) {
  const resolved = container.resolve(root);
  if (resolved === undefined) {
    sink += 1;
  }
}
const elapsed = performance.now() - startedAt;
console.log(`${SHAPE.padEnd(10)} ${((elapsed * 1e6) / ITERATIONS).toFixed(1)} ns/resolve   (sink ${sink})`);
