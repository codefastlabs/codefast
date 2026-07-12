import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * One event's schema. Any Standard Schema library works (zod, zod/mini, valibot, ...) —
 * the client bundle only pays for the one the app already ships.
 *
 * @since 0.5.0-canary.4
 */
export interface EventDefinition<Schema extends StandardSchemaV1 = StandardSchemaV1> {
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
 * Identity helper for declaring a catalog with inference — nicer call-site than
 * `satisfies EventCatalog` when the catalog is assembled across multiple files.
 *
 * @since 0.5.0-canary.4
 */
export function defineEventCatalog<Catalog extends EventCatalog>(catalog: Catalog): Catalog {
  return catalog;
}

/**
 * Validates event properties against the catalog schema and returns the parsed output
 * (unknown keys stripped / transforms applied) so destinations never see raw input.
 *
 * @throws Error when validation reports issues, or when the schema validates asynchronously —
 * tracking sits on synchronous call paths, so async schemas are unsupported by design.
 *
 * @since 1.0.0-canary.6
 */
export function assertValidEventProperties(schema: StandardSchemaV1, eventName: string, properties: unknown): unknown {
  const result = schema["~standard"].validate(properties);

  if (result instanceof Promise) {
    throw new TypeError(`Event "${eventName}" uses an async schema — event properties must validate synchronously`);
  }

  if (result.issues) {
    const detail = result.issues.map((issue) => issue.message).join("; ");

    throw new Error(`Invalid properties for event "${eventName}": ${detail}`);
  }

  return result.value;
}
