/** A mock Postgres connection pool that logs queries instead of touching a real database. */

import { token } from "@codefast/di";

/** Stands in for a real connection pool; every `query` logs its SQL and resolves to no rows. */
export class PgPool {
  constructor(private readonly connectionString: string) {}

  /** The data-source name this pool connects through. */
  get dsn(): string {
    return this.connectionString;
  }

  /** Runs `sql`, logs a truncated line, and resolves to an empty row set. */
  async query<Row>(sql: string, parameters: ReadonlyArray<unknown> = []): Promise<ReadonlyArray<Row>> {
    await this.#delay(1);
    console.log(`    [pg] ${sql.slice(0, 60)} (${parameters.length} params)`);

    return [] as ReadonlyArray<Row>;
  }

  #delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}

/** The injection token for the mock connection pool. */
export const PgPoolToken = token<PgPool>("PgPool");
