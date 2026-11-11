// Guest-list reads and writes. Every function takes the wedding slug and
// filters on it: the slug comes from the request's host, never from the body.

import { and, asc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

import {
  eventsForHousehold,
  normalizeName,
  type ImportedHousehold,
} from '../../shared/utils/wedding'
import type {
  HouseholdView,
  InvitationView,
  MailingAddress,
  WeddingConfig,
} from '../../shared/utils/wedding-types'
import {
  weddingGuestAliases,
  weddingGuests,
  weddingHouseholds,
  weddingResponses,
} from '../db/schema'

/**
 * The query-builder half of a Drizzle D1 database. Picking it keeps the engine
 * independent of the host app's full schema type, so the same code runs in any
 * repo that vendors the layer.
 */
export type WeddingDb = Pick<DrizzleD1Database, 'select' | 'insert' | 'update' | 'delete' | 'batch'>

// No 0/O/1/I/L: the code is read off paper by people of every age.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function newInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

async function loadHouseholds(
  db: WeddingDb,
  slug: string,
  householdIds?: string[],
): Promise<HouseholdView[]> {
  if (householdIds && householdIds.length === 0) return []
  const households = await db
    .select()
    .from(weddingHouseholds)
    .where(
      householdIds
        ? and(eq(weddingHouseholds.weddingSlug, slug), inArray(weddingHouseholds.id, householdIds))
        : eq(weddingHouseholds.weddingSlug, slug),
    )
    .orderBy(asc(weddingHouseholds.label))
  if (households.length === 0) return []
  const ids = households.map((h) => h.id)
  const guests = await db
    .select()
    .from(weddingGuests)
    .where(and(eq(weddingGuests.weddingSlug, slug), inArray(weddingGuests.householdId, ids)))
    .orderBy(asc(weddingGuests.sortOrder))
  const responses = guests.length
    ? await db
        .select()
        .from(weddingResponses)
        .where(
          inArray(
            weddingResponses.guestId,
            guests.map((g) => g.id),
          ),
        )
    : []
  const aliases = guests.length
    ? await db
        .select()
        .from(weddingGuestAliases)
        .where(
          inArray(
            weddingGuestAliases.guestId,
            guests.map((g) => g.id),
          ),
        )
    : []

  return households.map((h) => ({
    id: h.id,
    label: h.label,
    email: h.email,
    inviteCode: h.inviteCode,
    invitedEventIds: h.invitedEventIds,
    message: h.message,
    songRequest: h.songRequest,
    respondedAt: h.respondedAt,
    mailingAddress: h.mailingAddress ?? null,
    addressUpdatedAt: h.addressUpdatedAt,
    remindedAt: h.remindedAt,
    guests: guests
      .filter((g) => g.householdId === h.id)
      .map((g) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        isPlusOne: g.isPlusOne,
        dietary: g.dietary,
        aliases: aliases.filter((a) => a.guestId === g.id).map((a) => a.name),
        responses: Object.fromEntries(
          responses
            .filter((r) => r.guestId === g.id)
            .map((r) => [r.eventId, { attending: r.attending, meal: r.meal }]),
        ),
      })),
  }))
}

export function listHouseholds(db: WeddingDb, slug: string): Promise<HouseholdView[]> {
  return loadHouseholds(db, slug)
}

export async function getHousehold(
  db: WeddingDb,
  slug: string,
  householdId: string,
): Promise<HouseholdView | null> {
  const [household] = await loadHouseholds(db, slug, [householdId])
  return household ?? null
}

/**
 * The guest-facing view. Email, invite code and aliases are blanked, because a
 * name lookup can match a namesake's household. The mailing address is shown
 * only to someone who arrived with the household's code (`revealAddress`).
 * The forms leave a stored email alone when sent blank.
 */
export function toInvitation(
  wedding: WeddingConfig,
  household: HouseholdView,
  opts: { revealAddress?: boolean } = {},
): InvitationView {
  return {
    household: {
      ...household,
      email: null,
      inviteCode: '',
      mailingAddress: opts.revealAddress ? household.mailingAddress : null,
      guests: household.guests.map((g) => ({ ...g, aliases: [] })),
    },
    events: eventsForHousehold(wedding, household.invitedEventIds),
  }
}

/**
 * Households with a guest whose full name matches. Exact (normalized) match
 * only: a partial match would let anyone page through the guest list.
 */
export async function findByName(
  db: WeddingDb,
  slug: string,
  fullName: string,
): Promise<HouseholdView[]> {
  const key = normalizeName(fullName)
  if (!key.includes(' ')) return []
  const [direct, viaAlias] = await Promise.all([
    db
      .select({ householdId: weddingGuests.householdId })
      .from(weddingGuests)
      .where(and(eq(weddingGuests.weddingSlug, slug), eq(weddingGuests.nameKey, key))),
    db
      .select({ householdId: weddingGuests.householdId })
      .from(weddingGuestAliases)
      .innerJoin(weddingGuests, eq(weddingGuests.id, weddingGuestAliases.guestId))
      .where(and(eq(weddingGuestAliases.weddingSlug, slug), eq(weddingGuestAliases.nameKey, key))),
  ])
  const ids = [...direct, ...viaAlias].map((r) => r.householdId)
  return loadHouseholds(db, slug, [...new Set(ids)])
}

export async function findByCode(
  db: WeddingDb,
  slug: string,
  code: string,
): Promise<HouseholdView | null> {
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!clean) return null
  const [row] = await db
    .select({ id: weddingHouseholds.id })
    .from(weddingHouseholds)
    .where(and(eq(weddingHouseholds.weddingSlug, slug), eq(weddingHouseholds.inviteCode, clean)))
  return row ? getHousehold(db, slug, row.id) : null
}

export interface RsvpInput {
  guests: {
    id: string
    /** Only honored for plus-one slots: the guest names their own plus-one. */
    firstName?: string
    lastName?: string
    dietary?: string
    events: { eventId: string; attending: boolean; meal?: string | null }[]
  }[]
  message?: string
  songRequest?: string
  email?: string
}

export class RsvpError extends Error {}

/**
 * Replaces the household's answers in one batch. Rejects any guest or event the
 * household was not invited to, and any meal the event does not offer.
 */
export async function saveRsvp(
  db: WeddingDb,
  wedding: WeddingConfig,
  householdId: string,
  input: RsvpInput,
): Promise<HouseholdView> {
  const household = await getHousehold(db, wedding.slug, householdId)
  if (!household) throw new RsvpError('Invitation not found')
  const allowed = new Map(
    eventsForHousehold(wedding, household.invitedEventIds).map((e) => [e.id, e]),
  )
  const guestsById = new Map(household.guests.map((g) => [g.id, g]))
  const now = new Date()

  const guestUpdates = []
  const responseRows: (typeof weddingResponses.$inferInsert)[] = []
  for (const answer of input.guests) {
    const guest = guestsById.get(answer.id)
    if (!guest) throw new RsvpError('That guest is not on this invitation')
    const named = guest.isPlusOne
      ? { firstName: answer.firstName?.trim() ?? '', lastName: answer.lastName?.trim() ?? '' }
      : { firstName: guest.firstName, lastName: guest.lastName }
    const attendingAnything = answer.events.some((e) => e.attending)
    if (guest.isPlusOne && attendingAnything && !named.firstName) {
      throw new RsvpError('Please tell us your guest’s name')
    }
    for (const e of answer.events) {
      const event = allowed.get(e.eventId)
      if (!event) throw new RsvpError('That event is not on this invitation')
      const meal = e.attending && event.meals?.length ? (e.meal ?? null) : null
      if (meal !== null && !event.meals?.includes(meal)) {
        throw new RsvpError(`Choose a meal for ${event.name}`)
      }
      responseRows.push({
        guestId: guest.id,
        eventId: event.id,
        attending: e.attending,
        meal,
        updatedAt: now,
      })
    }
    guestUpdates.push(
      db
        .update(weddingGuests)
        .set({
          ...named,
          nameKey: normalizeName(`${named.firstName} ${named.lastName}`),
          dietary: answer.dietary?.trim() || null,
        })
        .where(eq(weddingGuests.id, guest.id)),
    )
  }

  const guestIds = household.guests.map((g) => g.id)
  await db.batch([
    db.delete(weddingResponses).where(inArray(weddingResponses.guestId, guestIds)),
    ...(responseRows.length ? [db.insert(weddingResponses).values(responseRows)] : []),
    ...guestUpdates,
    db
      .update(weddingHouseholds)
      .set({
        respondedAt: now,
        message: input.message?.trim() || null,
        songRequest: input.songRequest?.trim() || null,
        ...(input.email?.trim() ? { email: input.email.trim() } : {}),
      })
      .where(eq(weddingHouseholds.id, household.id)),
  ])
  const saved = await getHousehold(db, wedding.slug, household.id)
  if (!saved) throw new RsvpError('Invitation not found')
  return saved
}

function aliasRows(guestId: string, slug: string, names: readonly string[]) {
  const seen = new Set<string>()
  return names.flatMap((name) => {
    const nameKey = normalizeName(name)
    if (!nameKey.includes(' ') || seen.has(nameKey)) return []
    seen.add(nameKey)
    return [{ guestId, weddingSlug: slug, name: name.trim(), nameKey }]
  })
}

export async function createHouseholds(
  db: WeddingDb,
  slug: string,
  imported: ImportedHousehold[],
): Promise<number> {
  if (imported.length === 0) return 0
  const statements = []
  for (const h of imported) {
    const id = crypto.randomUUID()
    statements.push(
      db.insert(weddingHouseholds).values({
        id,
        weddingSlug: slug,
        label: h.label,
        email: h.email,
        inviteCode: newInviteCode(),
        invitedEventIds: h.invitedEventIds,
      }),
    )
    const guestRows = h.guests.map((g, i) => ({
      id: crypto.randomUUID(),
      householdId: id,
      weddingSlug: slug,
      firstName: g.first,
      lastName: g.last,
      nameKey: g.isPlusOne ? '' : normalizeName(`${g.first} ${g.last}`),
      isPlusOne: g.isPlusOne,
      sortOrder: i,
    }))
    statements.push(db.insert(weddingGuests).values(guestRows))
    const aliases = h.guests.flatMap((g, i) => aliasRows(guestRows[i]!.id, slug, g.aliases))
    if (aliases.length) statements.push(db.insert(weddingGuestAliases).values(aliases))
  }
  const [first, ...rest] = statements
  if (first) await db.batch([first, ...rest])
  return imported.length
}

export interface HouseholdEdit {
  label: string
  email: string | null
  invitedEventIds: string[]
  /** The full guest list in order. Omitted ids are removed with their answers. */
  guests: {
    id?: string
    firstName: string
    lastName: string
    isPlusOne: boolean
    aliases: string[]
  }[]
}

/** Replaces a household's details and guest list from the /manage editor. */
export async function editHousehold(
  db: WeddingDb,
  slug: string,
  householdId: string,
  edit: HouseholdEdit,
): Promise<boolean> {
  const current = await getHousehold(db, slug, householdId)
  if (!current) return false
  const known = new Set(current.guests.map((g) => g.id))
  const kept = new Set(edit.guests.flatMap((g) => (g.id && known.has(g.id) ? [g.id] : [])))
  const removed = current.guests.filter((g) => !kept.has(g.id)).map((g) => g.id)

  const statements = []
  statements.push(
    db
      .update(weddingHouseholds)
      .set({ label: edit.label, email: edit.email, invitedEventIds: edit.invitedEventIds })
      .where(eq(weddingHouseholds.id, householdId)),
  )
  if (removed.length)
    statements.push(db.delete(weddingGuests).where(inArray(weddingGuests.id, removed)))
  const allIds = current.guests.map((g) => g.id)
  if (allIds.length) {
    statements.push(
      db.delete(weddingGuestAliases).where(inArray(weddingGuestAliases.guestId, allIds)),
    )
  }
  edit.guests.forEach((g, i) => {
    const fields = {
      firstName: g.firstName.trim(),
      lastName: g.lastName.trim(),
      isPlusOne: g.isPlusOne,
      nameKey: normalizeName(`${g.firstName} ${g.lastName}`),
      sortOrder: i,
    }
    const id = g.id && known.has(g.id) ? g.id : crypto.randomUUID()
    statements.push(
      id === g.id
        ? db.update(weddingGuests).set(fields).where(eq(weddingGuests.id, id))
        : db.insert(weddingGuests).values({ id, householdId, weddingSlug: slug, ...fields }),
    )
    const aliases = aliasRows(id, slug, g.aliases)
    if (aliases.length) statements.push(db.insert(weddingGuestAliases).values(aliases))
  })
  const [first, ...rest] = statements
  if (first) await db.batch([first, ...rest])
  return true
}

/** Stores the household's mailing address from the personal /address link. */
export async function saveAddress(
  db: WeddingDb,
  slug: string,
  householdId: string,
  address: MailingAddress,
  email?: string,
): Promise<boolean> {
  const rows = await db
    .update(weddingHouseholds)
    .set({
      mailingAddress: address,
      addressUpdatedAt: new Date(),
      ...(email?.trim() ? { email: email.trim() } : {}),
    })
    .where(and(eq(weddingHouseholds.weddingSlug, slug), eq(weddingHouseholds.id, householdId)))
    .returning({ id: weddingHouseholds.id })
  return rows.length > 0
}

/** Households that have an email address and have not replied. */
export async function householdsToRemind(db: WeddingDb, slug: string): Promise<HouseholdView[]> {
  const rows = await db
    .select({ id: weddingHouseholds.id })
    .from(weddingHouseholds)
    .where(
      and(
        eq(weddingHouseholds.weddingSlug, slug),
        isNull(weddingHouseholds.respondedAt),
        isNotNull(weddingHouseholds.email),
      ),
    )
  return loadHouseholds(
    db,
    slug,
    rows.map((r) => r.id),
  )
}

export async function markReminded(
  db: WeddingDb,
  slug: string,
  householdIds: string[],
): Promise<void> {
  if (householdIds.length === 0) return
  await db
    .update(weddingHouseholds)
    .set({ remindedAt: new Date() })
    .where(
      and(eq(weddingHouseholds.weddingSlug, slug), inArray(weddingHouseholds.id, householdIds)),
    )
}

export async function deleteHousehold(
  db: WeddingDb,
  slug: string,
  householdId: string,
): Promise<boolean> {
  const rows = await db
    .delete(weddingHouseholds)
    .where(and(eq(weddingHouseholds.weddingSlug, slug), eq(weddingHouseholds.id, householdId)))
    .returning({ id: weddingHouseholds.id })
  return rows.length > 0
}

export interface EventTally {
  eventId: string
  name: string
  invited: number
  attending: number
  declined: number
  pending: number
  meals: Record<string, number>
}

/** Per-event headcounts for /manage. Unnamed plus-one slots that never answered are not counted as invited. */
export function tallyEvents(wedding: WeddingConfig, households: HouseholdView[]): EventTally[] {
  return wedding.events.map((event) => {
    const tally: EventTally = {
      eventId: event.id,
      name: event.name,
      invited: 0,
      attending: 0,
      declined: 0,
      pending: 0,
      meals: {},
    }
    for (const h of households) {
      if (!event.isPublic && !h.invitedEventIds.includes(event.id)) continue
      for (const g of h.guests) {
        const r = g.responses[event.id]
        if (g.isPlusOne && !r) continue
        tally.invited++
        if (!r) tally.pending++
        else if (r.attending) {
          tally.attending++
          if (r.meal) tally.meals[r.meal] = (tally.meals[r.meal] ?? 0) + 1
        } else tally.declined++
      }
    }
    return tally
  })
}
