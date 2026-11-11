import type { H3Event } from 'h3'

import {
  WEDDING_DEV_COOKIE,
  hashAdminToken,
  weddingBySlug,
  weddingForHost,
} from '../../shared/utils/wedding'
import type { WeddingConfig } from '../../shared/utils/wedding-types'

export const WEDDING_ADMIN_COOKIE = 'wedding_admin'

/** The wedding this request's host serves. In dev, the `?wedding=` cookie stands in for the host. */
export function resolveWedding(event: H3Event): WeddingConfig | null {
  const fromHost = weddingForHost(getRequestURL(event).hostname)
  if (fromHost) return fromHost
  return import.meta.dev ? weddingBySlug(getCookie(event, WEDDING_DEV_COOKIE)) : null
}

export function requireWedding(event: H3Event): WeddingConfig {
  const wedding = resolveWedding(event)
  if (!wedding) throw createError({ statusCode: 404, message: 'Not found' })
  return wedding
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
  const token = getCookie(event, WEDDING_ADMIN_COOKIE) ?? ''
  if (!(await isWeddingAdminToken(wedding, token))) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return wedding
}
