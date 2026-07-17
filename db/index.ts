import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { securePostgresPoolConfig } from "@/lib/postgres-config";
import * as schema from "./schema";

type Queryable = Pick<Pool | PoolClient, "query">;

let pool: Pool | null = null;
let database: DatabaseClient | null = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_NOT_CONFIGURED");
  }
  pool ??= new Pool({
    ...securePostgresPoolConfig(process.env.DATABASE_URL),
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
  return pool;
}

function postgresPlaceholders(source: string) {
  let index = 0;
  return source.replace(/\?/g, () => `$${++index}`);
}

export class PreparedStatement {
  private values: unknown[] = [];

  constructor(private readonly source: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async execute(queryable: Queryable = getPool()) {
    return queryable.query(postgresPlaceholders(this.source), this.values);
  }

  async first<T extends QueryResultRow = QueryResultRow>() {
    const result = await this.execute();
    return (result.rows[0] as T | undefined) ?? null;
  }

  async all<T extends QueryResultRow = QueryResultRow>() {
    const result = await this.execute();
    return { results: result.rows as T[] };
  }

  async run() {
    const result = await this.execute();
    return { success: true, meta: { changes: result.rowCount ?? 0 } };
  }
}

export class DatabaseClient {
  prepare(source: string) {
    return new PreparedStatement(source);
  }

  async batch(statements: PreparedStatement[]) {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      for (const statement of statements) await statement.execute(client);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export function getDatabase() {
  database ??= new DatabaseClient();
  return database;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}
