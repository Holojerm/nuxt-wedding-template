import { kv } from '@nuxthub/kv'
import type { H3Event } from 'h3'

// Fixed-window counter in KV, keyed by name and client IP. KV is eventually
// consistent, so a burst can overshoot by a few requests; for RSVP lookups
// that only needs to stop a script, that is enough.
export async function rateLimit(
  event: H3Event,
  opts: { name: string; limit: number; windowSeconds: number },
): Promise<void> {
  const ip = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? 'unknown'
  const window = Math.floor(Date.now() / 1000 / opts.windowSeconds)
  const key = `ratelimit:${opts.name}:${ip}:${window}`
  try {
    const count = ((await kv.get<number>(key)) ?? 0) + 1
    if (count > opts.limit) {
      throw createError({ statusCode: 429, message: 'Too many requests' })
    }
    await kv.set(key, count, { ttl: Math.max(60, opts.windowSeconds * 2) })
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 429) throw error
    // An unavailable KV must not take RSVPs down with it.
    console.warn(JSON.stringify({ kind: 'rate_limit_unavailable', name: opts.name }))
  }
}
