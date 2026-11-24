import { WEDDING_DEV_COOKIE, weddingBySlug, weddingForHost } from '../../shared/utils/wedding'
import type { WeddingConfig } from '../../shared/utils/wedding-types'

interface MountedWedding {
  wedding: WeddingConfig
  base: string
  signInUrl: string | null
}

// What a host set on the request (README.md › Shared host), carried to the
// browser in the payload. Null when the hostname decides, as it does by default.
function useMountedWedding(): MountedWedding | null {
  return useState<MountedWedding | null>('wedding-mounted', () => {
    const context = import.meta.server ? useRequestEvent()?.context : undefined
    if (!context?.wedding) return null
    return {
      wedding: context.wedding,
      base: context.weddingBase ?? '',
      signInUrl: context.weddingSignInUrl ?? null,
    }
  }).value
}

/**
 * The wedding this page serves, or null on the app's own pages. In dev,
 * `?wedding=<slug>` pins one through a cookie (`?wedding=` clears it), since
 * the dev proxy cannot answer on a wedding's real subdomain.
 */
export function useWeddingOrNull(): WeddingConfig | null {
  const mounted = useMountedWedding()
  if (mounted) return mounted.wedding
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

/** The path a wedding is mounted under: empty on its own hostname, `/<slug>` on a shared one. */
export function useWeddingBase(): string {
  return useMountedWedding()?.base ?? ''
}

/**
 * Turns a site path (`/rsvp`, `/api/wedding/lookup`) into one that works where
 * this wedding is mounted. Every link and request in the layer goes through it.
 */
export function useWeddingUrl(): (path: string) => string {
  const base = useWeddingBase()
  return (path) => (path === '/' ? base || '/' : `${base}${path}`)
}

/** Where a host signs the couple in, when it does that itself. */
export function useWeddingSignInUrl(): string | null {
  return useMountedWedding()?.signInUrl ?? null
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
