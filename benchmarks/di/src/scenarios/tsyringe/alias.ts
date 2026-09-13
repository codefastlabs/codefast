/**
 * tsyringe — the alias rows through `useToken`: one hop to a cached singleton, a chain of hops, and
 * a child's alias whose terminal the parent owns. A `useToken` cycle recurses rather than failing,
 * so the cycle row stays absent.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer, instanceCachingFactory } from "tsyringe";

import {
  ALIAS_BATCH,
  ALIAS_CHAIN,
  ALIAS_CHAIN_HOPS,
  ALIAS_PARENT_OWNED_TERMINAL,
  TO_ALIAS_BATCH,
  TO_ALIAS_REDIRECT,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface AliasedService {
  readonly name: string;
}

function concrete(): AliasedService {
  return { name: "concrete" };
}

function buildToAliasRedirectScenario(): BenchScenario {
  const concreteToken = Symbol("bench-tsyringe-alias-concrete");
  const abstractToken = Symbol("bench-tsyringe-alias-abstract");
  const container = tsyringeRootContainer.createChildContainer();
  container.register<AliasedService>(concreteToken, { useFactory: instanceCachingFactory(concrete) });
  container.register<AliasedService>(abstractToken, { useToken: concreteToken });
  const prewarmed = container.resolve<AliasedService>(abstractToken);

  return {
    ...TO_ALIAS_REDIRECT,
    what: "resolve a useToken registration that redirects to a cached singleton",
    batch: TO_ALIAS_BATCH,
    sanity: () =>
      container.resolve<AliasedService>(abstractToken) === container.resolve<AliasedService>(concreteToken) &&
      container.resolve<AliasedService>(abstractToken) === prewarmed,
    build: () =>
      batched(TO_ALIAS_BATCH, () => {
        container.resolve(abstractToken);
      }),
  };
}

function buildAliasChainScenario(): BenchScenario {
  const concreteToken = Symbol("bench-tsyringe-alias-chain-concrete");
  const hopTokens = Array.from({ length: ALIAS_CHAIN_HOPS }, (_value, hop) =>
    Symbol(`bench-tsyringe-alias-chain-hop-${String(hop)}`),
  );
  const container = tsyringeRootContainer.createChildContainer();
  container.register<AliasedService>(concreteToken, { useFactory: instanceCachingFactory(concrete) });
  container.register<AliasedService>(hopTokens[0]!, { useToken: concreteToken });
  for (let hop = 1; hop < ALIAS_CHAIN_HOPS; hop++) {
    container.register<AliasedService>(hopTokens[hop]!, { useToken: hopTokens[hop - 1]! });
  }
  const entryToken = hopTokens[ALIAS_CHAIN_HOPS - 1]!;
  const prewarmed = container.resolve<AliasedService>(entryToken);

  return {
    ...ALIAS_CHAIN,
    what: `resolve through ${String(ALIAS_CHAIN_HOPS)} chained useToken hops to a cached singleton`,
    batch: ALIAS_BATCH,
    sanity: () =>
      container.resolve<AliasedService>(entryToken) === prewarmed &&
      container.resolve<AliasedService>(concreteToken) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        container.resolve(entryToken);
      }),
  };
}

function buildAliasParentOwnedTerminalScenario(): BenchScenario {
  const concreteToken = Symbol("bench-tsyringe-alias-parent-concrete");
  const aliasToken = Symbol("bench-tsyringe-alias-parent-alias");
  const parent = tsyringeRootContainer.createChildContainer();
  parent.register<AliasedService>(concreteToken, { useFactory: instanceCachingFactory(concrete) });
  const child = parent.createChildContainer();
  child.register<AliasedService>(aliasToken, { useToken: concreteToken });
  const prewarmed = child.resolve<AliasedService>(aliasToken);

  return {
    ...ALIAS_PARENT_OWNED_TERMINAL,
    what: "resolve a child's useToken alias whose terminal singleton the parent owns",
    batch: ALIAS_BATCH,
    sanity: () =>
      !child.isRegistered(concreteToken) &&
      child.isRegistered(aliasToken) &&
      child.resolve<AliasedService>(aliasToken) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        child.resolve(aliasToken);
      }),
  };
}

/**
 * Builds tsyringe's alias scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeAliasScenarios(): ReadonlyArray<BenchScenario> {
  return [buildToAliasRedirectScenario(), buildAliasChainScenario(), buildAliasParentOwnedTerminalScenario()];
}
