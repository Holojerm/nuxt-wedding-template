// Tests run inside workerd through @cloudflare/vitest-pool-workers, so the
// guest-list store is exercised against a real D1 with the real migrations.
import { fileURLToPath } from 'node:url'

import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const migrationsPath = fileURLToPath(new URL('./server/db/migrations', import.meta.url))

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: { TEST_MIGRATIONS: await readD1Migrations(migrationsPath) },
      },
    })),
  ],
  test: {
    include: ['layers/*/test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
})
