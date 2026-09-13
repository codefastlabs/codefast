/**
 * `@codefast/di` — the alias shapes past a single hop.
 *
 * `to-alias-redirect` measures one hop to a cached singleton in the same container. Two properties of
 * the alias lane it cannot see: the walk is iterative, so hops compound; and an alias terminal may be
 * owned by a parent, which is why folding alias hops into the registry's bare own-map lookup is not
 * available and the folding lives behind the chain's version stamp instead. One row each.
 *
 * `alias-cycle-detected` is the failure row for the same walk: `resolve` and `resolveAsync` share one
 * alias-walk-and-diagnose routine, and the suite priced sharing it only through a missing-binding
 * throw, which never enters the walk at all.
 */
import { Container, token } from "@codefast/di";

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
  const concreteToken = token<AliasedService>("bench-cf-alias-chain-concrete");
  const hopTokens = Array.from({ length: ALIAS_CHAIN_HOPS }, (_value, hop) =>
    token<AliasedService>(`bench-cf-alias-chain-hop-${String(hop)}`),
  );
  const container = Container.create();

  container
    .bind(concreteToken)
    .toDynamic(() => ({ name: "concrete" }))
    .singleton();
  // hop 0 points at the concrete binding, every later hop at the one before it.
  container.bind(hopTokens[0]!).toAlias(concreteToken);
  for (let hop = 1; hop < ALIAS_CHAIN_HOPS; hop++) {
    container.bind(hopTokens[hop]!).toAlias(hopTokens[hop - 1]!);
  }

  const entryToken = hopTokens[ALIAS_CHAIN_HOPS - 1]!;
  const prewarmed = container.resolve(entryToken);

  return {
    ...ALIAS_CHAIN,
    batch: ALIAS_BATCH,
    sanity: () => container.resolve(entryToken) === prewarmed && container.resolve(concreteToken) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        container.resolve(entryToken);
      }),
  };
}

function buildAliasParentOwnedTerminalScenario(): BenchScenario {
  const concreteToken = token<AliasedService>("bench-cf-alias-parent-concrete");
  const aliasToken = token<AliasedService>("bench-cf-alias-parent-alias");
  const parent = Container.create();

  parent
    .bind(concreteToken)
    .toDynamic(() => ({ name: "concrete" }))
    .singleton();

  const child = parent.createChild();
  child.bind(aliasToken).toAlias(concreteToken);

  const prewarmed = child.resolve(aliasToken);

  return {
    ...ALIAS_PARENT_OWNED_TERMINAL,
    batch: ALIAS_BATCH,
    // The terminal has to live in the parent for the row to be about the parent-owned hop at all.
    sanity: () => !child.hasOwn(concreteToken) && child.hasOwn(aliasToken) && child.resolve(aliasToken) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        child.resolve(aliasToken);
      }),
  };
}

function buildAliasCycleDetectedScenario(): BenchScenario {
  const firstToken = token<AliasedService>("bench-cf-alias-cycle-first");
  const secondToken = token<AliasedService>("bench-cf-alias-cycle-second");
  const container = Container.create();

  container.bind(firstToken).toAlias(secondToken);
  container.bind(secondToken).toAlias(firstToken);

  return {
    ...ALIAS_CYCLE_DETECTED,
    batch: 1,
    sanity: () => {
      try {
        container.resolve(firstToken);

        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.resolve(firstToken);
          throw new Error("Expected the alias cycle to throw");
        } catch {
          // Expected failure path.
        }
      };
    },
  };
}

/**
 * @since 0.6.0
 */
export function buildCodefastAliasScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAliasChainScenario(), buildAliasParentOwnedTerminalScenario(), buildAliasCycleDetectedScenario()];
}
