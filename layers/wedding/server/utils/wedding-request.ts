import type { H3Event } from 'h3'

import {
  WEDDING_DEV_COOKIE,
  hashAdminToken,
  weddingBySlug,
  weddingForHost,
} from '../../shared/utils/wedding'
import type { WeddingConfig } from '../../shared/utils/wedding-types'

export const WEDDING_ADMIN_COOKIE = 'wedding_admin'

// A host that keeps weddings somewhere other than `weddings/` sets these on the
// request before any handler runs. README.md › Shared host.
declare module 'h3' {
  interface H3EventContext {
    wedding?: WeddingConfig
    /** Path the wedding is mounted under, such as `/maya-and-theo`. Empty at the root. */
    weddingBase?: string
    /** The host has already checked that this request comes from the couple. */
    weddingAdmin?: boolean
    /** Where the host signs a couple in. `/manage` links here in place of the token form. */
    weddingSignInUrl?: string
  }
}

/**
 * The wedding this request serves: the one a host set on the request, else the
 * one registered for the hostname. In dev, the `?wedding=` cookie stands in for the host.
 */
export function resolveWedding(event: H3Event): WeddingConfig | null {
  if (event.context.wedding) return event.context.wedding
  const fromHost = weddingForHost(getRequestURL(event).hostname)
  if (fromHost) return fromHost
  return import.meta.dev ? weddingBySlug(getCookie(event, WEDDING_DEV_COOKIE)) : null
}

export function requireWedding(event: H3Event): WeddingConfig {
  const wedding = resolveWedding(event)
  if (!wedding) throw createError({ statusCode: 404, message: 'Not found' })
  return wedding
}

/** The site's public address, for links in mail and calendars: the origin plus any mount path. */
export function weddingOrigin(event: H3Event): string {
  return `${getRequestURL(event).origin}${event.context.weddingBase ?? ''}`
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function isWeddingAdminToken(wedding: WeddingConfig, token: string): Promise<boolean> {
  if (!wedding.adminTokenSha256 || !token) return false
  return timingSafeEqual(await hashAdminToken(token), wedding.adminTokenSha256)
}

export async function requireWeddingAdmin(event: H3Event): Promise<WeddingConfig> {
  const wedding = requireWedding(event)
  if (event.context.weddingAdmin === true) return wedding
  const token = getCookie(event, WEDDING_ADMIN_COOKIE) ?? ''
  if (!(await isWeddingAdminToken(wedding, token))) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return wedding
}
