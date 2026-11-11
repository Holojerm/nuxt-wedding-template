import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { beforeEach, describe, expect, it } from 'vitest'

import * as schema from '../../../server/db/schema'
import {
  addressLines,
  csvField,
  dayOf,
  localDate,
  normalizeName,
  rsvpDaysLeft,
  parseGuestImport,
  rsvpClosed,
  hashAdminToken,
  weddingForHost,
} from '../shared/utils/wedding'
import type { WeddingConfig } from '../shared/utils/wedding-types'
import {
  coupleNoticeMail,
  escapeMailHtml,
  reminderMail,
  rsvpConfirmationMail,
  weddingMailConfig,
} from '../server/utils/wedding-email'
import {
  createHouseholds,
  editHousehold,
  findByCode,
  findByName,
  householdsToRemind,
  listHouseholds,
  markReminded,
  RsvpError,
  saveAddress,
  saveRsvp,
  tallyEvents,
  toInvitation,
} from '../server/utils/wedding-store'
import { icsDate, icsText } from '../server/utils/wedding-ics'
import { mayatheo } from '../weddings/mayatheo'

const db = drizzle(env.DB, { schema })

const wedding: WeddingConfig = mayatheo
const other: WeddingConfig = { ...mayatheo, slug: 'other', hosts: ['other.example.com'] }

beforeEach(async () => {
  await db.delete(schema.weddingHouseholds)
})

async function seed(text: string, w: WeddingConfig = wedding) {
  const { households, errors } = parseGuestImport(
    text,
    w.events.map((e) => e.id),
  )
  expect(errors).toEqual([])
  await createHouseholds(db, w.slug, households)
}

describe('normalizeName', () => {
  it('ignores case, accents, punctuation and spacing', () => {
    expect(normalizeName("  José   O'Neil ")).toBe('jose oneil')
    expect(normalizeName('Mary-Kate SMITH')).toBe('mary kate smith')
  })
})

describe('weddingForHost', () => {
  it('maps a configured host and nothing else', () => {
    expect(weddingForHost('MayaTheo.example.com')?.slug).toBe('mayatheo')
    expect(weddingForHost('example.com')).toBeNull()
    expect(weddingForHost('evil-mayatheo.example.com')).toBeNull()
  })
})

describe('parseGuestImport', () => {
  it('reads households, plus-ones, emails and private events', () => {
    const { households, errors } = parseGuestImport(
      '# comment\nThe Okafors | Ada Okafor; Chidi Okafor | ada@example.com | brunch\nSam Lee | Sam Lee; + guest',
      ['ceremony', 'brunch'],
    )
    expect(errors).toEqual([])
    expect(households).toHaveLength(2)
    expect(households[0]).toMatchObject({
      label: 'The Okafors',
      email: 'ada@example.com',
      invitedEventIds: ['brunch'],
    })
    expect(households[1]?.guests[1]).toEqual({ first: '', last: '', isPlusOne: true, aliases: [] })
  })

  it('rejects bad lines with their line number', () => {
    const { errors } = parseGuestImport(
      'Only a label\nX | + guest\nY | Y Z | not-an-email\nZ | Z Z | | gala',
      ['ceremony'],
    )
    expect(errors).toEqual([
      'Line 1: needs a label and at least one guest',
      'Line 2: needs at least one named guest',
      'Line 3: "not-an-email" is not an email address',
      'Line 4: unknown event gala',
    ])
  })
})

describe('csvField', () => {
  it('quotes and defuses formulas', () => {
    expect(csvField('a,b')).toBe('"a,b"')
    expect(csvField('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvField(null)).toBe('')
  })
})

describe('rsvpClosed', () => {
  it('closes after the deadline day ends in the wedding time zone', () => {
    const w = { ...wedding, rsvp: { ...wedding.rsvp, deadline: '2027-04-30' } }
    // 11pm in New York on the deadline is already May 1 in UTC.
    expect(rsvpClosed(w, new Date('2027-05-01T03:00:00Z'))).toBe(false)
    expect(rsvpClosed(w, new Date('2027-05-01T05:00:00Z'))).toBe(true)
  })
})

describe('hashAdminToken', () => {
  it('matches a known digest', async () => {
    expect(await hashAdminToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})

describe('lookup', () => {
  it('needs an exact full name and stays inside one wedding', async () => {
    await seed('The Okafors | Ada Okafor; Chidi Okafor')
    await seed('Other Okafors | Ada Okafor', other)
    expect(await findByName(db, wedding.slug, 'ada okafor')).toHaveLength(1)
    expect(await findByName(db, wedding.slug, 'Okafor')).toHaveLength(0)
    expect(await findByName(db, wedding.slug, 'Ada')).toHaveLength(0)
    const [found] = await findByName(db, other.slug, 'Ada Okafor')
    expect(found?.label).toBe('Other Okafors')
  })

  it('finds by code, case-insensitively, only in its own wedding', async () => {
    await seed('The Okafors | Ada Okafor')
    const [h] = await listHouseholds(db, wedding.slug)
    expect(h?.inviteCode).toMatch(/^[2-9A-HJKMNP-Z]{6}$/)
    expect((await findByCode(db, wedding.slug, h!.inviteCode.toLowerCase()))?.id).toBe(h!.id)
    expect(await findByCode(db, other.slug, h!.inviteCode)).toBeNull()
  })

  it('hides email and code in the guest view', async () => {
    await seed('The Okafors | Ada Okafor | ada@example.com')
    const [h] = await listHouseholds(db, wedding.slug)
    const view = toInvitation(wedding, h!)
    expect(view.household.email).toBeNull()
    expect(view.household.inviteCode).toBe('')
    expect(view.events.map((e) => e.id)).not.toContain('brunch')
  })
})

describe('saveRsvp', () => {
  async function household(line: string) {
    await seed(line)
    const [h] = await listHouseholds(db, wedding.slug)
    return h!
  }

  it('saves answers, names the plus-one, and replaces on resubmit', async () => {
    const h = await household('Sam Lee | Sam Lee; + guest')
    const [sam, plus] = h.guests
    await saveRsvp(db, wedding, h.id, {
      guests: [
        {
          id: sam!.id,
          events: [
            { eventId: 'ceremony', attending: true },
            { eventId: 'reception', attending: true, meal: 'Fish' },
          ],
        },
        {
          id: plus!.id,
          firstName: 'Jo',
          lastName: 'Park',
          events: [{ eventId: 'reception', attending: true, meal: 'Beef' }],
        },
      ],
      message: 'Cannot wait',
    })
    let [saved] = await listHouseholds(db, wedding.slug)
    expect(saved?.respondedAt).not.toBeNull()
    expect(saved?.guests[1]).toMatchObject({ firstName: 'Jo', lastName: 'Park' })
    expect(saved?.guests[0]?.responses.reception).toEqual({ attending: true, meal: 'Fish' })
    // The named plus-one can now be found by name.
    expect(await findByName(db, wedding.slug, 'Jo Park')).toHaveLength(1)

    await saveRsvp(db, wedding, h.id, {
      guests: [{ id: sam!.id, events: [{ eventId: 'reception', attending: false }] }],
    })
    ;[saved] = await listHouseholds(db, wedding.slug)
    expect(saved?.guests[0]?.responses).toEqual({ reception: { attending: false, meal: null } })

    const tally = tallyEvents(wedding, [saved!]).find((t) => t.eventId === 'reception')
    expect(tally).toMatchObject({ declined: 1, invited: 1 })
  })

  it('rejects events, guests and meals the invitation does not include', async () => {
    const h = await household('Sam Lee | Sam Lee')
    const sam = h.guests[0]!
    const attempt = (
      events: { eventId: string; attending: boolean; meal?: string }[],
      id = sam.id,
    ) => saveRsvp(db, wedding, h.id, { guests: [{ id, events }] })
    await expect(attempt([{ eventId: 'brunch', attending: true }])).rejects.toBeInstanceOf(
      RsvpError,
    )
    await expect(
      attempt([{ eventId: 'reception', attending: true, meal: 'Lobster' }]),
    ).rejects.toBeInstanceOf(RsvpError)
    await expect(attempt([], crypto.randomUUID())).rejects.toBeInstanceOf(RsvpError)
    await expect(saveRsvp(db, other, h.id, { guests: [] })).rejects.toBeInstanceOf(RsvpError)
  })

  it('requires a name for an attending plus-one', async () => {
    const h = await household('Sam Lee | Sam Lee; + guest')
    await expect(
      saveRsvp(db, wedding, h.id, {
        guests: [{ id: h.guests[1]!.id, events: [{ eventId: 'ceremony', attending: true }] }],
      }),
    ).rejects.toThrow('name')
  })
})

describe('aliases', () => {
  it('imports aliases and finds a guest by any of them', async () => {
    await seed('The Smiths | Robert Smith = Bob Smith = Robert Jones; Ann Smith')
    expect(await findByName(db, wedding.slug, 'Bob Smith')).toHaveLength(1)
    expect(await findByName(db, wedding.slug, 'robert jones')).toHaveLength(1)
    expect(await findByName(db, wedding.slug, 'Bob')).toHaveLength(0)
    const [h] = await listHouseholds(db, wedding.slug)
    expect(h?.guests[0]?.aliases).toEqual(['Bob Smith', 'Robert Jones'])
    // Never shown to a guest: a namesake lookup must not reveal maiden names.
    expect(toInvitation(wedding, h!).household.guests[0]?.aliases).toEqual([])
  })
})

describe('editHousehold', () => {
  it('renames, re-aliases, adds and removes guests, dropping removed answers', async () => {
    await seed('Lee | Sam Lee; Pat Lee')
    let [h] = await listHouseholds(db, wedding.slug)
    const [sam, pat] = h!.guests
    await saveRsvp(db, wedding, h!.id, {
      guests: [
        { id: sam!.id, events: [{ eventId: 'ceremony', attending: true }] },
        { id: pat!.id, events: [{ eventId: 'ceremony', attending: true }] },
      ],
    })
    const ok = await editHousehold(db, wedding.slug, h!.id, {
      label: 'The Lees',
      email: 'lee@example.com',
      invitedEventIds: ['brunch'],
      guests: [
        {
          id: sam!.id,
          firstName: 'Samuel',
          lastName: 'Lee',
          isPlusOne: false,
          aliases: ['Sam Lee'],
        },
        { firstName: '', lastName: '', isPlusOne: true, aliases: [] },
      ],
    })
    expect(ok).toBe(true)
    ;[h] = await listHouseholds(db, wedding.slug)
    expect(h).toMatchObject({
      label: 'The Lees',
      email: 'lee@example.com',
      invitedEventIds: ['brunch'],
    })
    expect(h?.guests.map((g) => [g.firstName, g.isPlusOne])).toEqual([
      ['Samuel', false],
      ['', true],
    ])
    expect(h?.guests[0]?.responses.ceremony?.attending).toBe(true)
    expect(await findByName(db, wedding.slug, 'Sam Lee')).toHaveLength(1)
    expect(await findByName(db, wedding.slug, 'Pat Lee')).toHaveLength(0)
    expect(await editHousehold(db, other.slug, h!.id, { ...h!, guests: [] })).toBe(false)
  })
})

describe('addresses', () => {
  const address = {
    line1: '1 Main St',
    line2: 'Apt 2',
    city: 'Albany',
    region: 'NY',
    postalCode: '12207',
    country: 'United States',
  }

  it('saves an address, shown back only to a code holder', async () => {
    await seed('Lee | Sam Lee')
    const [h] = await listHouseholds(db, wedding.slug)
    expect(await saveAddress(db, other.slug, h!.id, address)).toBe(false)
    expect(await saveAddress(db, wedding.slug, h!.id, address, 'sam@example.com')).toBe(true)
    const [saved] = await listHouseholds(db, wedding.slug)
    expect(saved?.mailingAddress).toEqual(address)
    expect(saved?.email).toBe('sam@example.com')
    expect(toInvitation(wedding, saved!).household.mailingAddress).toBeNull()
    expect(toInvitation(wedding, saved!, { revealAddress: true }).household.mailingAddress).toEqual(
      address,
    )
  })

  it('formats for an envelope', () => {
    expect(addressLines(address)).toEqual([
      '1 Main St',
      'Apt 2',
      'Albany, NY 12207',
      'United States',
    ])
    expect(addressLines(null)).toEqual([])
  })
})

describe('reminders', () => {
  it('targets households with an email that have not replied', async () => {
    await seed('A | Ann Able | a@example.com\nB | Bo Baker\nC | Cy Cole | c@example.com')
    const all = await listHouseholds(db, wedding.slug)
    const c = all.find((h) => h.label === 'C')!
    await saveRsvp(db, wedding, c.id, {
      guests: [{ id: c.guests[0]!.id, events: [{ eventId: 'ceremony', attending: true }] }],
    })
    const due = await householdsToRemind(db, wedding.slug)
    expect(due.map((h) => h.label)).toEqual(['A'])
    await markReminded(db, wedding.slug, [due[0]!.id])
    expect((await householdsToRemind(db, wedding.slug))[0]?.remindedAt).toBeInstanceOf(Date)
  })
})

describe('wedding email', () => {
  it("prefers the wedding settings and falls back to the host app's Resend", () => {
    expect(weddingMailConfig({})).toBeNull()
    expect(
      weddingMailConfig({ resend: { apiKey: 'k', from: 'Host App <hello@example.com>' } }),
    ).toEqual({ apiKey: 'k', address: 'hello@example.com' })
    expect(
      weddingMailConfig({
        resend: { apiKey: 'k', from: 'x@y.com' },
        wedding: { emailApiKey: 'w', emailFrom: 'hi@example.org' },
      }),
    ).toEqual({ apiKey: 'w', address: 'hi@example.org' })
  })

  it('confirms answers with an edit link, escaping guest input', async () => {
    await seed('<b>Lee</b> | Sam Lee | sam@example.com')
    const [h] = await listHouseholds(db, wedding.slug)
    await saveRsvp(db, wedding, h!.id, {
      guests: [
        {
          id: h!.guests[0]!.id,
          events: [{ eventId: 'reception', attending: true, meal: 'Fish' }],
        },
      ],
      message: '<script>alert(1)</script>',
    })
    const [saved] = await listHouseholds(db, wedding.slug)
    const mail = rsvpConfirmationMail(wedding, saved!, 'https://mayatheo.example.com')
    expect(mail?.to).toEqual(['sam@example.com'])
    expect(mail?.html).toContain(`/rsvp?code=${saved!.inviteCode}`)
    expect(mail?.html).toContain('Attending · Fish')
    expect(mail?.html).not.toContain('<b>Lee</b>')
    expect(mail?.text).toContain(
      `Change your answers: https://mayatheo.example.com/rsvp?code=`,
    )

    expect(coupleNoticeMail(wedding, saved!, 'https://x', true)).toBeNull()
    const notice = coupleNoticeMail(
      { ...wedding, rsvp: { ...wedding.rsvp, notifyEmails: ['couple@example.com'] } },
      saved!,
      'https://x',
      true,
    )
    expect(notice?.subject).toBe('RSVP: <b>Lee</b>')
    expect(notice?.html).not.toContain('<script>')
    expect(reminderMail(wedding, { ...saved!, email: null }, 'https://x')).toBeNull()
    expect(escapeMailHtml(`"&'`)).toBe('&quot;&amp;&#39;')
  })
})

describe('song requests', () => {
  it('saves with the RSVP and clears when blanked', async () => {
    await seed('Lee | Sam Lee')
    const [h] = await listHouseholds(db, wedding.slug)
    const guests = [{ id: h!.guests[0]!.id, events: [{ eventId: 'ceremony', attending: true }] }]
    await saveRsvp(db, wedding, h!.id, { guests, songRequest: '  September  ' })
    expect((await listHouseholds(db, wedding.slug))[0]?.songRequest).toBe('September')
    await saveRsvp(db, wedding, h!.id, { guests, songRequest: '' })
    expect((await listHouseholds(db, wedding.slug))[0]?.songRequest).toBeNull()
  })
})

describe('dates', () => {
  it('reads the calendar date in the wedding time zone', () => {
    expect(localDate('America/New_York', '2027-06-13T02:00:00Z')).toBe('2027-06-12')
  })

  it('counts days left to RSVP and stops after the deadline', () => {
    const w = { ...wedding, rsvp: { ...wedding.rsvp, deadline: '2027-04-30' } }
    expect(rsvpDaysLeft(w, new Date('2027-04-16T16:00:00Z'))).toBe(14)
    expect(rsvpDaysLeft(w, new Date('2027-05-01T03:00:00Z'))).toBe(0)
    expect(rsvpDaysLeft(w, new Date('2027-05-01T16:00:00Z'))).toBeNull()
    expect(rsvpDaysLeft({ ...w, rsvp: { ...w.rsvp, deadline: null } })).toBeNull()
  })

  it('is day-of only across the wedding weekend, pointing at the next event', () => {
    // mayatheo: welcome Fri 7pm, ceremony + reception Sat, brunch is private.
    expect(dayOf(wedding, new Date('2027-06-10T16:00:00Z'))).toBeNull()
    const friday = dayOf(wedding, new Date('2027-06-11T20:00:00Z'))
    expect(friday?.today.map((e) => e.id)).toEqual(['welcome'])
    expect(friday?.next?.id).toBe('welcome')
    const saturday = dayOf(wedding, new Date('2027-06-12T22:30:00Z'))
    expect(saturday?.today.map((e) => e.id)).toEqual(['ceremony', 'reception'])
    expect(saturday?.next?.id).toBe('reception')
    // Late Saturday night, after the reception: still the weekend, nothing next.
    expect(dayOf(wedding, new Date('2027-06-13T03:30:00Z'))?.next).toBeNull()
    expect(dayOf(wedding, new Date('2027-06-14T16:00:00Z'))).toBeNull()
  })
})

describe('ics', () => {
  it('formats UTC dates and escapes text', () => {
    expect(icsDate('2027-06-12T17:30:00-04:00')).toBe('20270612T213000Z')
    expect(icsText('Maya, Theo; \\ party\nnight')).toBe('Maya\\, Theo\\; \\\\ party\\nnight')
  })
})
