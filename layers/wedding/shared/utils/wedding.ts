// Pure helpers shared by the pages and the API. No Nuxt or Nitro imports, so
// test/wedding.test.ts can call them directly.

import { weddings } from '../../weddings'
import type { MailingAddress, WeddingConfig, WeddingEvent } from './wedding-types'

export const WEDDING_DEV_COOKIE = 'wedding_dev'

export function weddingForHost(hostname: string): WeddingConfig | null {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return Object.values(weddings).find((w) => w.hosts.includes(host)) ?? null
}

export function weddingBySlug(slug: string | null | undefined): WeddingConfig | null {
  if (!slug) return null
  return Object.hasOwn(weddings, slug) ? (weddings[slug] ?? null) : null
}

/**
 * The comparison key for a guest name: case, accents, punctuation and runs of
 * whitespace all ignored, so "José O'Neil" matches "jose oneil".
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s-]+/g, ' ')
    .trim()
}

/** Events a household may see and answer: every public one, plus any it was invited to by id. */
export function eventsForHousehold(
  wedding: WeddingConfig,
  invitedEventIds: readonly string[],
): WeddingEvent[] {
  return wedding.events.filter((e) => e.isPublic || invitedEventIds.includes(e.id))
}

/** The calendar date (`YYYY-MM-DD`) of an instant in a given time zone. */
export function localDate(timeZone: string, at: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(at))
}

const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000

/** True once the deadline day has ended in the wedding's own time zone. */
export function rsvpClosed(wedding: WeddingConfig, now: Date = new Date()): boolean {
  const deadline = wedding.rsvp.deadline
  return deadline ? localDate(wedding.timeZone, now) > deadline : false
}

/** Whole days until the RSVP deadline (0 on the day itself), or null without one or once closed. */
export function rsvpDaysLeft(wedding: WeddingConfig, now: Date = new Date()): number | null {
  const deadline = wedding.rsvp.deadline
  if (!deadline) return null
  const left = dayNumber(deadline) - dayNumber(localDate(wedding.timeZone, now))
  return left >= 0 ? left : null
}

/**
 * During the wedding weekend (the first public event's day through the last's),
 * today's public events and the next one not yet over. Null on any other day.
 */
export function dayOf(
  wedding: WeddingConfig,
  now: Date = new Date(),
): { today: WeddingEvent[]; next: WeddingEvent | null } | null {
  // Spread-and-sort rather than toSorted(): older guests' iPhones predate it.
  const events = [...wedding.events.filter((e) => e.isPublic)].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  )
  const first = events[0]
  const last = events.at(-1)
  if (!first || !last) return null
  const today = localDate(wedding.timeZone, now)
  if (today < localDate(wedding.timeZone, first.startsAt)) return null
  if (today > localDate(wedding.timeZone, last.endsAt)) return null
  const todays = events.filter((e) => localDate(wedding.timeZone, e.startsAt) === today)
  const next = todays.find((e) => new Date(e.endsAt).getTime() > now.getTime()) ?? null
  return { today: todays, next }
}

export function formatEventDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatEventTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** `YYYY-MM-DD` → "June 12, 2027" without a time-zone shift. */
export function formatPlainDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)))
}

export interface ImportedHousehold {
  label: string
  email: string | null
  guests: { first: string; last: string; isPlusOne: boolean; aliases: string[] }[]
  invitedEventIds: string[]
}

/**
 * Parses the bulk-import box on /manage. One household per line:
 *
 *   Label | Guest One; Guest Two; + guest | email | event-id event-id
 *
 * Only the first two fields are required. "+ guest" (or "+1") adds an unnamed
 * plus-one slot the guest names when they RSVP. A guest's last word is their
 * last name; one-word names get an empty last name. Other names the lookup
 * should accept follow an "=": `Robert Smith = Bob Smith = Robert Jones`.
 */
export function parseGuestImport(
  text: string,
  knownEventIds: readonly string[],
): { households: ImportedHousehold[]; errors: string[] } {
  const households: ImportedHousehold[] = []
  const errors: string[] = []
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return
    const [label = '', guestField = '', email = '', events = ''] = line
      .split('|')
      .map((s) => s.trim())
    const lineNo = index + 1
    if (!label || !guestField) {
      errors.push(`Line ${lineNo}: needs a label and at least one guest`)
      return
    }
    const guests = guestField
      .split(';')
      .map((g) => g.trim())
      .filter(Boolean)
      .map((g) => {
        if (/^\+\s*(1|guest)$/i.test(g)) {
          return { first: '', last: '', isPlusOne: true, aliases: [] }
        }
        const [primary = '', ...aliases] = g.split('=').map((n) => n.trim())
        const { first, last } = splitName(primary)
        return { first, last, isPlusOne: false, aliases: aliases.filter(Boolean) }
      })
    if (!guests.some((g) => !g.isPlusOne)) {
      errors.push(`Line ${lineNo}: needs at least one named guest`)
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Line ${lineNo}: "${email}" is not an email address`)
      return
    }
    const invitedEventIds = events.split(/[\s,]+/).filter(Boolean)
    const unknown = invitedEventIds.filter((id) => !knownEventIds.includes(id))
    if (unknown.length) {
      errors.push(`Line ${lineNo}: unknown event ${unknown.join(', ')}`)
      return
    }
    households.push({ label, email: email || null, guests, invitedEventIds })
  })
  return { households, errors }
}

/** "Mary Kate Smith" → first "Mary Kate", last "Smith". */
export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  const last = parts.length > 1 ? (parts.pop() ?? '') : ''
  return { first: parts.join(' '), last }
}

export const EMPTY_ADDRESS: MailingAddress = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
}

/** The address as it goes on an envelope, one line per entry. */
export function addressLines(a: MailingAddress | null | undefined): string[] {
  if (!a) return []
  const cityLine = [a.city, [a.region, a.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  return [a.line1, a.line2, cityLine, a.country].map((l) => l.trim()).filter(Boolean)
}

export async function hashAdminToken(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Escapes one CSV field per RFC 4180, and defuses spreadsheet formula injection. */
export function csvField(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
