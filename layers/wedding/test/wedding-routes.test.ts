// Host → wedding resolution and the manage API's admin gate, exercised as real
// requests: the actual handlers mounted on an h3 app, driven with Requests that
// carry a Host header and a cookie. The registry is swapped for two weddings
// whose admin tokens are known (the real one stores only a hash); the real
// sample wedding's host is checked for resolution only.

import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import * as h3 from 'h3'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import * as schema from '../../../server/db/schema'
import * as sharedWedding from '../shared/utils/wedding'
import type { WeddingConfig } from '../shared/utils/wedding-types'
import * as weddingEmail from '../server/utils/wedding-email'
import * as weddingRequest from '../server/utils/wedding-request'
import * as weddingStore from '../server/utils/wedding-store'
import { mayatheo } from '../weddings/mayatheo'

const db = drizzle(env.DB, { schema })

const TOKEN_A = 'alpha-admin-token-0123456789'
const TOKEN_B = 'bravo-admin-token-9876543210'
const HOST_A = 'alpha.example.test'
const HOST_B = 'bravo.example.test'

const { registry } = vi.hoisted(() => ({
  registry: {} as Record<string, unknown>,
}))
vi.mock('../weddings', async (importActual) => {
  const actual = await importActual<typeof import('../weddings')>()
  return {
    ...actual,
    weddings: new Proxy(registry, {
      get: (t, k) => t[k as string] ?? (actual.weddings as Record<string, unknown>)[k as string],
      ownKeys: (t) => [...new Set([...Reflect.ownKeys(actual.weddings), ...Reflect.ownKeys(t)])],
      getOwnPropertyDescriptor: (_t, k) => {
        const v = registry[k as string] ?? (actual.weddings as Record<string, unknown>)[k as string]
        return v ? { enumerable: true, configurable: true, value: v } : undefined
      },
    }),
  }
})

let handle: (request: Request) => Promise<Response>

function call(
  path: string,
  init: { host: string; method?: string; cookie?: string; body?: unknown },
): Promise<Response> {
  const headers = new Headers({ host: init.host })
  if (init.cookie) headers.set('cookie', init.cookie)
  if (init.body !== undefined) headers.set('content-type', 'application/json')
  return handle(
    new Request(`https://${init.host}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    }),
  )
}

const adminCookie = (token: string) => `${weddingRequest.WEDDING_ADMIN_COOKIE}=${token}`
const MANAGE = '/api/wedding/manage/households'

beforeAll(async () => {
  const base = (slug: string, host: string, token: string): Promise<WeddingConfig> =>
    sharedWedding.hashAdminToken(token).then((adminTokenSha256) => ({
      ...mayatheo,
      slug,
      hosts: [host],
      adminTokenSha256,
    }))
  registry.alpha = await base('alpha', HOST_A, TOKEN_A)
  registry.bravo = await base('bravo', HOST_B, TOKEN_B)

  // Nitro auto-imports the handlers rely on, as globals.
  for (const mod of [h3, sharedWedding, weddingEmail, weddingRequest, weddingStore]) {
    for (const [name, value] of Object.entries(mod)) vi.stubGlobal(name, value)
  }
  vi.stubGlobal('db', db)
  vi.stubGlobal('schema', schema)
  vi.stubGlobal('rateLimit', async () => undefined)
  vi.stubGlobal('useRuntimeConfig', () => ({}))

  const app = h3.createApp()
  const router = h3.createRouter()
  const [households, sessionPost, sessionDelete] = await Promise.all([
    import('../server/api/wedding/manage/households/index.get'),
    import('../server/api/wedding/manage/session.post'),
    import('../server/api/wedding/manage/session.delete'),
  ])
  router.get(MANAGE, households.default)
  router.post('/api/wedding/manage/session', sessionPost.default)
  router.delete('/api/wedding/manage/session', sessionDelete.default)
  app.use(router)
  handle = h3.toWebHandler(app)
})

beforeEach(async () => {
  await db.delete(schema.weddingHouseholds)
})

describe('host → wedding', () => {
  it('resolves a configured host, case-insensitively and with a trailing dot', async () => {
    for (const host of [HOST_A, HOST_A.toUpperCase(), `${HOST_A}.`]) {
      // 401, not 404: the wedding was found and then the missing token refused.
      expect((await call(MANAGE, { host })).status, host).toBe(401)
    }
  })

  it('resolves the real production host from the checked-in registry', async () => {
    const host = mayatheo.hosts[0]!
    expect((await call(MANAGE, { host })).status).toBe(401)
  })

  it.each([
    ['a suffix attack', `${HOST_A}.evil.test`],
    ['a prefix attack', `evil${HOST_A}`],
    ['a subdomain', `www.${HOST_A}`],
    ['the bare apex', 'example.test'],
    ['an unrelated host', 'example.com'],
    ['another workers.dev host', 'other-app.example.workers.dev'],
    ['the real host with a look-alike TLD', 'mayatheo.example.co'],
  ])('does not resolve %s (404 even with a valid token)', async (_label, host) => {
    expect((await call(MANAGE, { host, cookie: adminCookie(TOKEN_A) })).status).toBe(404)
  })

  it('404s the session route on an unknown host, before looking at the token', async () => {
    const res = await call('/api/wedding/manage/session', {
      host: 'evil.test',
      method: 'POST',
      body: { token: TOKEN_A },
    })
    expect(res.status).toBe(404)
  })
})

describe('manage API admin gate', () => {
  it('401s with no cookie, an empty cookie, and a wrong token', async () => {
    expect((await call(MANAGE, { host: HOST_A })).status).toBe(401)
    expect(
      (
        await call(MANAGE, {
          host: HOST_A,
          cookie: `${weddingRequest.WEDDING_ADMIN_COOKIE}=`,
        })
      ).status,
    ).toBe(401)
    expect(
      (
        await call(MANAGE, {
          host: HOST_A,
          cookie: adminCookie('wrong-token-0123456789'),
        })
      ).status,
    ).toBe(401)
    expect(
      (
        await call(MANAGE, {
          host: HOST_A,
          cookie: adminCookie(TOKEN_A.slice(0, -1)),
        })
      ).status,
    ).toBe(401)
  })

  it('lets the right token in and lists only that wedding’s households', async () => {
    for (const [slug, name] of [
      ['alpha', 'The Lovelaces | Ada Lovelace'],
      ['bravo', 'The Byrons | Bob Byron'],
    ] as const) {
      const { households } = sharedWedding.parseGuestImport(
        `${name}`,
        (registry[slug] as WeddingConfig).events.map((e) => e.id),
      )
      await weddingStore.createHouseholds(db, slug, households)
    }
    const res = await call(MANAGE, {
      host: HOST_A,
      cookie: adminCookie(TOKEN_A),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      households: Array<{ guests: Array<{ name: string }> }>
    }
    expect(JSON.stringify(body.households)).toContain('Ada')
    expect(JSON.stringify(body.households)).not.toContain('Bob')
  })

  it('refuses another wedding’s token, in both directions', async () => {
    expect((await call(MANAGE, { host: HOST_A, cookie: adminCookie(TOKEN_B) })).status).toBe(401)
    expect((await call(MANAGE, { host: HOST_B, cookie: adminCookie(TOKEN_A) })).status).toBe(401)
    expect((await call(MANAGE, { host: HOST_B, cookie: adminCookie(TOKEN_B) })).status).toBe(200)
  })

  it('refuses everything for a wedding with no admin hash configured', async () => {
    const saved = registry.alpha
    registry.alpha = { ...(saved as WeddingConfig), adminTokenSha256: '' }
    try {
      expect((await call(MANAGE, { host: HOST_A, cookie: adminCookie('') })).status).toBe(401)
      expect((await call(MANAGE, { host: HOST_A, cookie: adminCookie(TOKEN_A) })).status).toBe(401)
    } finally {
      registry.alpha = saved
    }
  })
})

describe('manage session', () => {
  const session = (host: string, token: unknown) =>
    call('/api/wedding/manage/session', {
      host,
      method: 'POST',
      body: { token },
    })

  it('401s a wrong token and sets no cookie', async () => {
    const res = await session(HOST_A, 'wrong-token-0123456789')
    expect(res.status).toBe(401)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('401s another wedding’s token', async () => {
    expect((await session(HOST_A, TOKEN_B)).status).toBe(401)
  })

  it('trades the right token for an httpOnly strict cookie that opens the manage API', async () => {
    const res = await session(HOST_A, TOKEN_A)
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain(`${weddingRequest.WEDDING_ADMIN_COOKIE}=${TOKEN_A}`)
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Strict/i)
    const cookie = setCookie.split(';')[0]!
    expect((await call(MANAGE, { host: HOST_A, cookie })).status).toBe(200)
    // The cookie is only a credential for the wedding whose hash it matches.
    expect((await call(MANAGE, { host: HOST_B, cookie })).status).toBe(401)
  })

  it('DELETE clears the cookie on a known host and 404s an unknown one', async () => {
    const ok = await call('/api/wedding/manage/session', {
      host: HOST_A,
      method: 'DELETE',
    })
    expect(ok.status).toBe(200)
    expect(ok.headers.get('set-cookie') ?? '').toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i)
    const bad = await call('/api/wedding/manage/session', {
      host: 'evil.test',
      method: 'DELETE',
    })
    expect(bad.status).toBe(404)
  })
})
