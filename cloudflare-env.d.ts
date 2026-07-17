declare module "cloudflare:workers" {
  interface Env {
    DB: D1Database;
    INITIAL_ADMIN_EMAIL?: string;
  }

  export const env: Env;
}
