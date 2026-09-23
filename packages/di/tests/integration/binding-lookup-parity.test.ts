/**
 * Every lookup a container answers agrees with a history-free model of its bindings, across any
 * sequence of binds, refinements, removals and rebinds on containers that share their tokens — the
 * contract a lookup cache in front of the registry has to keep.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import type { Token } from "#core/token";
import type { BindingIdentifier, Constructor } from "#core/types";
import { RebindUnboundTokenError } from "#errors/errors";

/** A class key, so the lane a constructor takes is covered beside the token lane. */
class KeyedService {}

type Key = Token<unknown> | Constructor;

const KEYS: ReadonlyArray<Key> = [token<number>("blp:Alpha"), token<number>("blp:Beta"), KeyedService];
const NAMES = ["primary", "replica"] as const;

/** One binding the model holds: what slot it takes and the value that identifies it. */
interface ModelEntry {
  readonly shape: "default" | "named" | "member";
  readonly name: string | undefined;
  readonly value: number;
  readonly id: BindingIdentifier;
}

/** The containers a run drives: two roots and a child of the first, which shares its tokens. */
interface Fleet {
  readonly containers: Array<Container>;
  readonly own: Array<Map<Key, Array<ModelEntry>>>;
}

const CHILD = 1;
const INDEPENDENT_ROOT = 2;

function parentOf(slot: number): number | undefined {
  return slot === CHILD ? 0 : undefined;
}

function createFleet(): Fleet {
  const root = Container.create();
  return {
    containers: [root, root.createChild(), Container.create()],
    own: [new Map(), new Map(), new Map()],
  };
}

function ownEntries(fleet: Fleet, slot: number, key: Key): Array<ModelEntry> {
  let entries = fleet.own[slot]!.get(key);
  if (entries === undefined) {
    entries = [];
    fleet.own[slot]!.set(key, entries);
  }
  return entries;
}

/** Last-wins in the model: a newcomer on an occupied slot removes the occupant and joins the end. */
function record(entries: Array<ModelEntry>, entry: ModelEntry): void {
  if (entry.shape !== "member") {
    const occupant = entries.findIndex((held) => held.shape === entry.shape && held.name === entry.name);
    if (occupant !== -1) {
      entries.splice(occupant, 1);
    }
  }
  entries.push(entry);
}

function modelSingle(fleet: Fleet, slot: number, key: Key, name: string | undefined): number | undefined {
  const entries = fleet.own[slot]!.get(key) ?? [];
  const match = entries.find((entry) =>
    name === undefined ? entry.shape === "default" : entry.shape === "named" && entry.name === name,
  );
  if (match !== undefined) {
    return match.value;
  }
  const parent = parentOf(slot);
  return parent === undefined ? undefined : modelSingle(fleet, parent, key, name);
}

function modelAll(fleet: Fleet, slot: number, key: Key): Array<number> {
  const own = (fleet.own[slot]!.get(key) ?? []).map((entry) => entry.value);
  const parent = parentOf(slot);
  return parent === undefined ? own : [...own, ...modelAll(fleet, parent, key)];
}

function modelHas(fleet: Fleet, slot: number, key: Key): boolean {
  if ((fleet.own[slot]!.get(key) ?? []).length > 0) {
    return true;
  }
  const parent = parentOf(slot);
  return parent !== undefined && modelHas(fleet, parent, key);
}

function expectAgreement(fleet: Fleet, step: string): void {
  for (let slot = 0; slot < fleet.containers.length; slot += 1) {
    const container = fleet.containers[slot]!;
    for (const key of KEYS) {
      const where = `${step} — container ${String(slot)}, key ${key.name}`;
      expect(container.resolveOptional(key), `${where}: resolveOptional`).toBe(
        modelSingle(fleet, slot, key, undefined),
      );
      for (const name of NAMES) {
        expect(container.resolveOptional(key, { name }), `${where}: resolveOptional({ name: ${name} })`).toBe(
          modelSingle(fleet, slot, key, name),
        );
      }
      expect(container.resolveAll(key), `${where}: resolveAll`).toStrictEqual(modelAll(fleet, slot, key));
      expect(container.has(key), `${where}: has`).toBe(modelHas(fleet, slot, key));
    }
  }
}

const operation = fc.record({
  kind: fc.constantFrom("bind", "bindNamed", "bindMember", "unbind", "unbindById", "rebind", "replaceRoot"),
  slot: fc.nat(2),
  key: fc.nat(KEYS.length - 1),
  name: fc.nat(NAMES.length - 1),
  pick: fc.nat(16),
});

describe("binding lookups against a history-free model", () => {
  it("agree after every step of any operation sequence", () => {
    expect(() => {
      fc.assert(
        fc.property(fc.array(operation, { maxLength: 40 }), (steps) => {
          const fleet = createFleet();
          let nextValue = 0;

          for (const [index, step] of steps.entries()) {
            const container = fleet.containers[step.slot]!;
            const key = KEYS[step.key]!;
            const entries = ownEntries(fleet, step.slot, key);
            const value = (nextValue += 1);
            const label = `step ${String(index)} ${step.kind}(${String(step.slot)}, ${key.name})`;

            switch (step.kind) {
              case "bind": {
                const id = container.bind(key).toConstantValue(value).id();
                record(entries, { shape: "default", name: undefined, value, id });
                break;
              }
              case "bindNamed": {
                const name = NAMES[step.name]!;
                const id = container.bind(key).toConstantValue(value).whenNamed(name).id();
                record(entries, { shape: "named", name, value, id });
                break;
              }
              case "bindMember": {
                const id = container.bind(key).toConstantValue(value).many().id();
                record(entries, { shape: "member", name: undefined, value, id });
                break;
              }
              case "unbind":
                container.unbind(key);
                entries.length = 0;
                break;
              case "unbindById": {
                const target = entries[step.pick % Math.max(entries.length, 1)];
                if (target !== undefined) {
                  container.unbind(target.id);
                  entries.splice(entries.indexOf(target), 1);
                }
                break;
              }
              case "rebind": {
                if (entries.length === 0) {
                  let refused = false;
                  try {
                    container.rebind(key);
                  } catch (error) {
                    refused = error instanceof RebindUnboundTokenError;
                  }
                  if (!refused) {
                    throw new Error(`${label}: rebind of a token this container does not bind was not refused`);
                  }
                  break;
                }
                const id = container.rebind(key).toConstantValue(value).id();
                entries.length = 0;
                entries.push({ shape: "default", name: undefined, value, id });
                break;
              }
              case "replaceRoot":
                // A fresh container binding tokens a dropped one held: the case a per-token cache is weakest at.
                void fleet.containers[INDEPENDENT_ROOT]!.dispose();
                fleet.containers[INDEPENDENT_ROOT] = Container.create();
                fleet.own[INDEPENDENT_ROOT] = new Map();
                break;
            }

            expectAgreement(fleet, label);
          }
        }),
        { numRuns: 300 },
      );
    }).not.toThrow();
  });
});
