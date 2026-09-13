/**
 * injection-js — the alias rows through `useExisting`: one hop to a cached singleton, a chain of
 * hops, a child injector's alias whose terminal the parent owns, and two aliases pointing at each
 * other, which the injector reports as a cycle.
 */
import "reflect-metadata";
import type { Provider } from "injection-js";
import { InjectionToken, ReflectiveInjector } from "injection-js";

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

function concreteProvider(token: InjectionToken<AliasedService>): Provider {
  return { provide: token, useFactory: (): AliasedService => ({ name: "concrete" }), deps: [] };
}

function buildToAliasRedirectScenario(): BenchScenario {
  const concreteToken = new InjectionToken<AliasedService>("bench-injection-js-alias-concrete");
  const abstractToken = new InjectionToken<AliasedService>("bench-injection-js-alias-abstract");
  const injector = ReflectiveInjector.resolveAndCreate([
    concreteProvider(concreteToken),
    { provide: abstractToken, useExisting: concreteToken },
  ]);
  const prewarmed = injector.get(abstractToken) as AliasedService;

  return {
    ...TO_ALIAS_REDIRECT,
    what: "get() a useExisting provider that redirects to a cached singleton",
    batch: TO_ALIAS_BATCH,
    sanity: () =>
      injector.get(abstractToken) === injector.get(concreteToken) && injector.get(abstractToken) === prewarmed,
    build: () =>
      batched(TO_ALIAS_BATCH, () => {
        injector.get(abstractToken);
      }),
  };
}

function buildAliasChainScenario(): BenchScenario {
  const concreteToken = new InjectionToken<AliasedService>("bench-injection-js-alias-chain-concrete");
  const hopTokens = Array.from(
    { length: ALIAS_CHAIN_HOPS },
    (_value, hop) => new InjectionToken<AliasedService>(`bench-injection-js-alias-chain-hop-${String(hop)}`),
  );
  const providers: Array<Provider> = [
    concreteProvider(concreteToken),
    { provide: hopTokens[0]!, useExisting: concreteToken },
  ];
  for (let hop = 1; hop < ALIAS_CHAIN_HOPS; hop++) {
    providers.push({ provide: hopTokens[hop]!, useExisting: hopTokens[hop - 1]! });
  }
  const injector = ReflectiveInjector.resolveAndCreate(providers);
  const entryToken = hopTokens[ALIAS_CHAIN_HOPS - 1]!;
  const prewarmed = injector.get(entryToken) as AliasedService;

  return {
    ...ALIAS_CHAIN,
    what: `get() through ${String(ALIAS_CHAIN_HOPS)} chained useExisting hops to a cached singleton`,
    batch: ALIAS_BATCH,
    sanity: () => injector.get(entryToken) === prewarmed && injector.get(concreteToken) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        injector.get(entryToken);
      }),
  };
}

function buildAliasParentOwnedTerminalScenario(): BenchScenario {
  const concreteToken = new InjectionToken<AliasedService>("bench-injection-js-alias-parent-concrete");
  const aliasToken = new InjectionToken<AliasedService>("bench-injection-js-alias-parent-alias");
  const parent = ReflectiveInjector.resolveAndCreate([concreteProvider(concreteToken)]);
  const child = parent.resolveAndCreateChild([{ provide: aliasToken, useExisting: concreteToken }]);
  const prewarmed = child.get(aliasToken) as AliasedService;

  return {
    ...ALIAS_PARENT_OWNED_TERMINAL,
    what: "get() a child injector's useExisting alias whose terminal singleton the parent owns",
    batch: ALIAS_BATCH,
    sanity: () => child.get(aliasToken) === prewarmed && parent.get(concreteToken) === prewarmed,
    build: () =>
      batched(ALIAS_BATCH, () => {
        child.get(aliasToken);
      }),
  };
}

function buildAliasCycleDetectedScenario(): BenchScenario {
  const firstToken = new InjectionToken<AliasedService>("bench-injection-js-alias-cycle-first");
  const secondToken = new InjectionToken<AliasedService>("bench-injection-js-alias-cycle-second");
  const injector = ReflectiveInjector.resolveAndCreate([
    { provide: firstToken, useExisting: secondToken },
    { provide: secondToken, useExisting: firstToken },
  ]);

  return {
    ...ALIAS_CYCLE_DETECTED,
    what: "get() a useExisting alias that points back at itself and fail fast",
    batch: 1,
    sanity: () => {
      try {
        injector.get(firstToken);
        return false;
      } catch {
        return true;
      }
    },
    build: () => {
      return () => {
        try {
          injector.get(firstToken);
          throw new Error("Expected the alias cycle to throw");
        } catch {
          // Expected failure path.
        }
      };
    },
  };
}

/**
 * Builds injection-js's alias scenarios.
 */
export function buildInjectionJsAliasScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildToAliasRedirectScenario(),
    buildAliasChainScenario(),
    buildAliasParentOwnedTerminalScenario(),
    buildAliasCycleDetectedScenario(),
  ];
}
