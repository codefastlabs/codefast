/**
 * InversifyJS 8 — the alias shapes past a single hop, through `toService()`: a chain of hops, a
 * child's alias whose terminal the parent owns, and two aliases pointing at each other.
 */
import "reflect-metadata";
import { Container } from "inversify";

import {
  ALIAS_BATCH,
  ALIAS_CHAIN,
  ALIAS_CHAIN_HOPS,
  ALIAS_CYCLE_DETECTED,
  ALIAS_PARENT_OWNED_TERMINAL,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface AliasedService {
  readonly name: string;
}

function buildAliasChainScenario(): BenchScenario {
  const concreteIdentifier = Symbol("bench-inv-alias-chain-concrete");
  const hopIdentifiers = Array.from({ length: ALIAS_CHAIN_HOPS }, (_value, hop) =>
    Symbol(`bench-inv-alias-chain-hop-${String(hop)}`),
  );
  const container = new Container({ jitless: false });
  container
    .bind<AliasedService>(concreteIdentifier)
    .toDynamicValue(() => ({ name: "concrete" }))
    .inSingletonScope();
  container.bind<AliasedService>(hopIdentifiers[0]!).toService(concreteIdentifier);
  for (let hop = 1; hop < ALIAS_CHAIN_HOPS; hop++) {
    container.bind<AliasedService>(hopIdentifiers[hop]!).toService(hopIdentifiers[hop - 1]!);
  }
  const entryIdentifier = hopIdentifiers[ALIAS_CHAIN_HOPS - 1]!;
  const prewarmed = container.get<AliasedService>(entryIdentifier);

  return {
    ...ALIAS_CHAIN,
    what: `get() through ${String(ALIAS_CHAIN_HOPS)} chained toService() hops to a cached singleton`,
    batch: ALIAS_BATCH,
    sanity: () =>
      container.get<AliasedService>(entryIdentifier) === prewarmed &&
      container.get<AliasedService>(concreteIdentifier) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        container.get(entryIdentifier);
      }),
  };
}

function buildAliasParentOwnedTerminalScenario(): BenchScenario {
  const concreteIdentifier = Symbol("bench-inv-alias-parent-concrete");
  const aliasIdentifier = Symbol("bench-inv-alias-parent-alias");
  const parent = new Container({ jitless: false });
  parent
    .bind<AliasedService>(concreteIdentifier)
    .toDynamicValue(() => ({ name: "concrete" }))
    .inSingletonScope();
  const child = new Container({ jitless: false, parent });
  child.bind<AliasedService>(aliasIdentifier).toService(concreteIdentifier);
  const prewarmed = child.get<AliasedService>(aliasIdentifier);

  return {
    ...ALIAS_PARENT_OWNED_TERMINAL,
    what: "get() a child's toService() alias whose terminal singleton the parent owns",
    batch: ALIAS_BATCH,
    sanity: () =>
      !child.isCurrentBound(concreteIdentifier) &&
      child.isCurrentBound(aliasIdentifier) &&
      child.get<AliasedService>(aliasIdentifier) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        child.get(aliasIdentifier);
      }),
  };
}

function buildAliasCycleDetectedScenario(): BenchScenario {
  const firstIdentifier = Symbol("bench-inv-alias-cycle-first");
  const secondIdentifier = Symbol("bench-inv-alias-cycle-second");
  const container = new Container({ jitless: false });
  container.bind<AliasedService>(firstIdentifier).toService(secondIdentifier);
  container.bind<AliasedService>(secondIdentifier).toService(firstIdentifier);

  return {
    ...ALIAS_CYCLE_DETECTED,
    what: "get() a toService() alias that points back at itself and fail fast",
    batch: 1,
    sanity: () => {
      try {
        container.get(firstIdentifier);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.get(firstIdentifier);
          throw new Error("Expected the alias cycle to throw");
        } catch {
          // Expected failure path.
        }
      };
    },
  };
}

/**
 * Builds inversify's alias scenarios.
 */
export function buildInversifyAliasScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAliasChainScenario(), buildAliasParentOwnedTerminalScenario(), buildAliasCycleDetectedScenario()];
}
