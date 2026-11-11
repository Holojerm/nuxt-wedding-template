// The shape of one wedding site. Everything a guest reads lives in a config
// file under layers/wedding/weddings/; only the guest list and RSVPs live in D1.
// SPEC.md › Content model explains the split.

export type WeddingTheme = 'catalogue' | 'letterpress'

export interface WeddingEvent {
  /** Stable id stored with every RSVP. Never rename one after invitations go out. */
  id: string
  name: string
  /** ISO 8601 with offset, e.g. `2027-06-12T17:30:00-04:00`. */
  startsAt: string
  endsAt: string
  venue: string
  address: string
  /** One line, e.g. "Black tie optional". */
  dress?: string
  description?: string
  /** Asks a meal choice on the RSVP. */
  meals?: string[]
  /** Shown to every guest. A private event is shown only to households invited to it. */
  isPublic: boolean
}

export interface WeddingHotel {
  name: string
  address: string
  url?: string
  note?: string
}

export interface WeddingRegistry {
  name: string
  url: string
  note?: string
}

export interface WeddingFaq {
  q: string
  a: string
}

export interface WeddingPhoto {
  /**
   * Root-relative path to a high-resolution master in the app's public/. The
   * edge resizes and re-encodes it per device (DESIGN.md › Imagery).
   */
  src: string
  /** Intrinsic size of `src`, so the browser reserves the space before it loads. */
  width: number
  height: number
  alt: string
  caption: string
  /** Required for anything the couple didn't shoot. Rendered under the caption. */
  credit?: { author: string; license: string; licenseUrl: string; sourceUrl: string; note?: string }
}

export interface WeddingGuideSection {
  title: string
  items: { name: string; note: string; address?: string; url?: string }[]
}

export interface MailingAddress {
  line1: string
  line2: string
  city: string
  region: string
  postalCode: string
  country: string
}

export interface WeddingConfig {
  slug: string
  /** Production hostnames that serve this wedding. */
  hosts: string[]
  couple: { first: string; second: string }
  /** How the names read together, e.g. "Maya & Theo". */
  title: string
  theme: WeddingTheme
  /** The headline date, ISO `YYYY-MM-DD`. Null until the date is set. */
  date: string | null
  /** IANA zone the events happen in; dates render in it, not the guest's zone. */
  timeZone: string
  city: string
  venue: { name: string; address: string; mapsUrl: string; url?: string }
  /** A line under the names on the home page. */
  tagline: string
  story: string[]
  events: WeddingEvent[]
  travel: { intro: string; hotels: WeddingHotel[]; gettingThere: string[] }
  registry: { intro: string; links: WeddingRegistry[] }
  faq: WeddingFaq[]
  photos: WeddingPhoto[]
  /** The link-preview image; defaults to the first photo. Root-relative. */
  shareImage?: string
  /** Optional "Nearby" page for out-of-town guests. */
  guide?: { intro: string; sections: WeddingGuideSection[] }
  rsvp: {
    /** ISO `YYYY-MM-DD`. Responses close at the end of this day in `timeZone`. */
    deadline: string | null
    /** Shown on the RSVP page and in the FAQ. */
    contactEmail: string
    /** Who hears about each new or changed RSVP. Empty sends nothing. */
    notifyEmails: string[]
  }
  /**
   * SHA-256 (hex) of the couple's admin token. The token itself lives in
   * a password manager; a hash of 32 random bytes is safe to commit. Empty disables /manage.
   */
  adminTokenSha256: string
  /** Marks copy that still needs the couple's real details. Shown as a banner on /manage. */
  placeholders: string[]
}

// ── Views the API returns ─────────────────────────────────────────────────

export interface GuestView {
  id: string
  firstName: string
  lastName: string
  isPlusOne: boolean
  dietary: string | null
  aliases: string[]
  responses: Record<string, { attending: boolean; meal: string | null }>
}

export interface HouseholdView {
  id: string
  label: string
  email: string | null
  inviteCode: string
  invitedEventIds: string[]
  message: string | null
  songRequest: string | null
  respondedAt: Date | string | null
  mailingAddress: MailingAddress | null
  addressUpdatedAt: Date | string | null
  remindedAt: Date | string | null
  guests: GuestView[]
}

/** What a guest sees after a lookup: their party and the events they may answer. */
export interface InvitationView {
  household: HouseholdView
  events: WeddingEvent[]
}
