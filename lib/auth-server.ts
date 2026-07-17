import { Pool } from "pg";
import { betterAuth } from "better-auth";

const disabledDatabaseUrl = "postgresql://disabled:disabled@127.0.0.1:5432/disabled";
const disabledSecret = "sailboard-auth-is-not-configured-0000000000000000";

export function isAuthConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET,
  );
}

export const auth = betterAuth({
  appName: "SailBoard",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? disabledSecret,
  database: new Pool({
    connectionString: process.env.DATABASE_URL ?? disabledDatabaseUrl,
    max: 3,
    allowExitOnIdle: true,
  }),
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  } : {},
  session: { expiresIn: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24 },
});
