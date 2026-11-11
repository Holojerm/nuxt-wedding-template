import { WEDDING_DEV_COOKIE, weddingBySlug, weddingForHost } from '../../shared/utils/wedding'
import type { WeddingConfig } from '../../shared/utils/wedding-types'

/**
 * The wedding this hostname serves, or null on the app's own hosts. In dev,
 * `?wedding=<slug>` pins one through a cookie (`?wedding=` clears it), since
 * the dev proxy cannot answer on a wedding's real subdomain.
 */
export function useWeddingOrNull(): WeddingConfig | null {
  const url = useRequestURL()
  const fromHost = weddingForHost(url.hostname)
  if (fromHost || !import.meta.dev) return fromHost
  const cookie = useCookie<string | null>(WEDDING_DEV_COOKIE, { sameSite: 'lax' })
  const pinned = url.searchParams.get('wedding')
  if (pinned !== null) cookie.value = pinned || null
  return weddingBySlug(cookie.value)
}

/** For pages under the wedding route tree, which only exist when a wedding resolved. */
export function useWedding(): WeddingConfig {
  const wedding = useWeddingOrNull()
  if (!wedding) throw createError({ statusCode: 404, message: 'Not found', fatal: true })
  return wedding
}

/**
 * "Now" for date-dependent UI (day-of mode, the RSVP nudge). In dev,
 * `?now=2027-06-12T15:00:00-04:00` previews any moment; production ignores it.
 */
export function useWeddingNow(): Date {
  if (import.meta.dev) {
    const preview = useRequestURL().searchParams.get('now')
    if (preview && !Number.isNaN(Date.parse(preview))) return new Date(preview)
  }
  return new Date()
}
