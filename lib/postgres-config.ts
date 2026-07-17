import type { PoolConfig } from "pg";

export function securePostgresPoolConfig(connectionString: string): Pick<PoolConfig, "connectionString" | "ssl"> {
  const url = new URL(connectionString);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: isLocal ? undefined : { rejectUnauthorized: true },
  };
}
