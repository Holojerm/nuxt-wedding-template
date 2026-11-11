import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import type { MailingAddress } from '../../shared/utils/wedding-types'

// Guest lists and RSVPs. Every row carries its wedding's slug, and every query
// filters on the slug the request's host resolved to, so one deployment can
// serve several weddings without a guest ever reaching another couple's list.
// Nothing here references `users`: the engine runs in repos without accounts.

const timestamp = (name: string) => integer(name, { mode: 'timestamp' })

export const weddingHouseholds = sqliteTable(
  'wedding_households',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    weddingSlug: text('wedding_slug').notNull(),
    /** How the invitation is addressed, e.g. "The Okafor Family". */
    label: text('label').notNull(),
    email: text('email'),
    /** Printed on the invitation; looks the household up without typing a name. */
    inviteCode: text('invite_code').notNull(),
    /** JSON array of private event ids this household is invited to. */
    invitedEventIds: text('invited_event_ids', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default([]),
    message: text('message'),
    /** "A song that will get you dancing", from the RSVP form. */
    songRequest: text('song_request'),
    respondedAt: timestamp('responded_at'),
    /** Collected through the personal /address link, for save-the-dates and invitations. */
    mailingAddress: text('mailing_address', { mode: 'json' }).$type<MailingAddress>(),
    addressUpdatedAt: timestamp('address_updated_at'),
    /** Last RSVP reminder email; /manage shows it so nobody gets two in a day. */
    remindedAt: timestamp('reminded_at'),
    createdAt: timestamp('created_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex('wedding_households_code_idx').on(t.weddingSlug, t.inviteCode),
    index('wedding_households_wedding_idx').on(t.weddingSlug),
  ],
)

export const weddingGuests = sqliteTable(
  'wedding_guests',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    householdId: text('household_id')
      .notNull()
      .references(() => weddingHouseholds.id, { onDelete: 'cascade' }),
    weddingSlug: text('wedding_slug').notNull(),
    firstName: text('first_name').notNull().default(''),
    lastName: text('last_name').notNull().default(''),
    /** normalizeName(first + ' ' + last); what the RSVP lookup matches on. */
    nameKey: text('name_key').notNull().default(''),
    /** An unnamed "and guest" slot; the guest fills in the name when they RSVP. */
    isPlusOne: integer('is_plus_one', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    dietary: text('dietary'),
  },
  (t) => [
    index('wedding_guests_lookup_idx').on(t.weddingSlug, t.nameKey),
    index('wedding_guests_household_idx').on(t.householdId),
  ],
)

/**
 * Other names a guest may type at the RSVP lookup: a nickname, a maiden name.
 * Matched exactly like the primary name, after normalizeName().
 */
export const weddingGuestAliases = sqliteTable(
  'wedding_guest_aliases',
  {
    guestId: text('guest_id')
      .notNull()
      .references(() => weddingGuests.id, { onDelete: 'cascade' }),
    weddingSlug: text('wedding_slug').notNull(),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
  },
  (t) => [
    uniqueIndex('wedding_guest_aliases_guest_key_idx').on(t.guestId, t.nameKey),
    index('wedding_guest_aliases_lookup_idx').on(t.weddingSlug, t.nameKey),
  ],
)

export const weddingResponses = sqliteTable(
  'wedding_responses',
  {
    guestId: text('guest_id')
      .notNull()
      .references(() => weddingGuests.id, { onDelete: 'cascade' }),
    eventId: text('event_id').notNull(),
    attending: integer('attending', { mode: 'boolean' }).notNull(),
    meal: text('meal'),
    updatedAt: timestamp('updated_at')
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex('wedding_responses_guest_event_idx').on(t.guestId, t.eventId)],
)

export type WeddingHousehold = typeof weddingHouseholds.$inferSelect
export type WeddingGuest = typeof weddingGuests.$inferSelect
export type WeddingResponse = typeof weddingResponses.$inferSelect
export type WeddingGuestAlias = typeof weddingGuestAliases.$inferSelect
