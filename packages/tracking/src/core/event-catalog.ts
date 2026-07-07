import type { z } from "zod";

/**
 * One event's Zod schema plus which side of the app is allowed to fire it.
 *
 * @since 0.5.0-canary.4
 */
export interface EventDefinition<Schema extends z.ZodType = z.ZodType> {
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

/**
 * Identity helper for declaring a catalog with inference — nicer call-site than
 * `satisfies EventCatalog` when the catalog is assembled across multiple files.
 *
 * @since 0.5.0-canary.4
 */
export function defineEventCatalog<Catalog extends EventCatalog>(catalog: Catalog): Catalog {
  return catalog;
}
