/**
 * Awilix — the alias rows through `aliasTo()`: one hop to a cached singleton, a chain of hops, a
 * scope's alias whose terminal the root owns, and two aliases pointing at each other.
 */
import { aliasTo, asFunction, createContainer } from "awilix";

import {
  ALIAS_BATCH,
  ALIAS_CHAIN,
  ALIAS_CHAIN_HOPS,
  ALIAS_CYCLE_DETECTED,
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
  const container = createContainer();
  container.register({ concrete: asFunction(concrete).singleton(), abstract: aliasTo("concrete") });
  const prewarmed = container.resolve<AliasedService>("abstract");

  return {
    ...TO_ALIAS_REDIRECT,
    what: "resolve an aliasTo() registration that redirects to a cached singleton",
    batch: TO_ALIAS_BATCH,
    sanity: () =>
      container.resolve<AliasedService>("abstract") === container.resolve<AliasedService>("concrete") &&
      container.resolve<AliasedService>("abstract") === prewarmed,
    build: () =>
      batched(TO_ALIAS_BATCH, () => {
        container.resolve("abstract");
      }),
  };
}

function buildAliasChainScenario(): BenchScenario {
  const container = createContainer();
  container.register({ concrete: asFunction(concrete).singleton(), hop0: aliasTo("concrete") });
  for (let hop = 1; hop < ALIAS_CHAIN_HOPS; hop++) {
    container.register(`hop${String(hop)}`, aliasTo(`hop${String(hop - 1)}`));
  }
  const entry = `hop${String(ALIAS_CHAIN_HOPS - 1)}`;
  const prewarmed = container.resolve<AliasedService>(entry);

  return {
    ...ALIAS_CHAIN,
    what: `resolve through ${String(ALIAS_CHAIN_HOPS)} chained aliasTo() hops to a cached singleton`,
    batch: ALIAS_BATCH,
    sanity: () =>
      container.resolve<AliasedService>(entry) === prewarmed &&
      container.resolve<AliasedService>("concrete") === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        container.resolve(entry);
      }),
  };
}

function buildAliasParentOwnedTerminalScenario(): BenchScenario {
  const root = createContainer();
  root.register({ concrete: asFunction(concrete).singleton() });
  const scope = root.createScope();
  scope.register({ alias: aliasTo("concrete") });
  const prewarmed = scope.resolve<AliasedService>("alias");

  return {
    ...ALIAS_PARENT_OWNED_TERMINAL,
    what: "resolve a scope's aliasTo() whose terminal singleton the root owns",
    batch: ALIAS_BATCH,
    // The alias is the scope's and the terminal the root's: the root cannot see the alias, and both resolve to one singleton.
    sanity: () =>
      !root.hasRegistration("alias") &&
      scope.resolve<AliasedService>("alias") === prewarmed &&
      root.resolve<AliasedService>("concrete") === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        scope.resolve("alias");
      }),
  };
}

function buildAliasCycleDetectedScenario(): BenchScenario {
  const container = createContainer();
  container.register({ first: aliasTo("second"), second: aliasTo("first") });

  return {
    ...ALIAS_CYCLE_DETECTED,
    what: "resolve an aliasTo() that points back at itself and fail fast",
    batch: 1,
    sanity: () => {
      try {
        container.resolve("first");
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          container.resolve("first");
          throw new Error("Expected the alias cycle to throw");
        } catch {
          // Expected failure path.
        }
      };
    },
  };
}

/**
 * Builds Awilix's alias scenarios.
 *
 * @since 0.8.0
 */
export function buildAwilixAliasScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildToAliasRedirectScenario(),
    buildAliasChainScenario(),
    buildAliasParentOwnedTerminalScenario(),
    buildAliasCycleDetectedScenario(),
  ];
}
