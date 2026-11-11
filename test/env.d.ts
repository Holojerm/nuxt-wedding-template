import type { D1Migration } from '@cloudflare/vitest-pool-workers'

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database
    KV: KVNamespace
    /** Migrations read from server/db/migrations, applied by test/setup.ts. */
    TEST_MIGRATIONS: D1Migration[]
  }
}
