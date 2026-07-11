import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * One event's schema plus which side of the app is allowed to fire it. Any Standard
 * Schema library works (zod, zod/mini, valibot, ...) — the client bundle only pays for
 * the one the app already ships.
 *
 * @since 0.5.0-canary.4
 */
export interface EventDefinition<Schema extends StandardSchemaV1 = StandardSchemaV1> {
  owner: "client" | "server";
  schema: Schema;
}

/**
 * An app-defined map of event name to its definition. `@codefast/tracking` ships no
 * events of its own — every consuming app builds and passes in its own catalog.
 *
 * @since 0.5.0-canary.4
 */
export type EventCatalog = Record<string, EventDefinition>;

/**
 * Filters a catalog down to the events a given owner may fire. Client and server
 * trackers are built from this, so calling a server-owned event from client code
 * (or vice versa) is a compile-time error, not a runtime surprise.
 *
 * @since 0.5.0-canary.4
 */
export type EventsOf<Catalog extends EventCatalog, Owner extends "client" | "server"> = {
  [Key in keyof Catalog as Catalog[Key]["owner"] extends Owner ? Key : never]: Catalog[Key];
};

/** The props type a catalog event accepts, inferred from its schema's output. */
export type EventPropsOf<Definition extends EventDefinition> = StandardSchemaV1.InferOutput<Definition["schema"]>;

/**
 * Identity helper for declaring a catalog with inference — nicer call-site than
 * `satisfies EventCatalog` when the catalog is assembled across multiple files.
 *
 * @since 0.5.0-canary.4
 */
export function defineEventCatalog<Catalog extends EventCatalog>(catalog: Catalog): Catalog {
  return catalog;
}

/**
 * Validates event props against the catalog schema and throws on mismatch. The validated
 * (possibly transformed) value is deliberately discarded — trackers always send the
 * caller's original props, so a schema transform can never desync client and server.
 *
 * @throws Error when validation reports issues, or when the schema validates asynchronously —
 * tracking sits on synchronous call paths, so async schemas are unsupported by design.
 */
export function assertValidEventProps(schema: StandardSchemaV1, eventName: string, props: unknown): void {
  const result = schema["~standard"].validate(props);

  if (result instanceof Promise) {
    throw new TypeError(`Event "${eventName}" uses an async schema — event props must validate synchronously`);
  }

  if (result.issues) {
    const detail = result.issues.map((issue) => issue.message).join("; ");

    throw new Error(`Invalid props for event "${eventName}": ${detail}`);
  }
}
