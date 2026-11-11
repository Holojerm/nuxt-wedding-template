import { icsDate, icsText } from '../utils/wedding-ics'

// "Add to calendar". One file works for Apple, Google and Outlook. Without a
// household it lists public events only, because the plain link is shareable;
// `?code=` (from the confirmation email) or `?h=` (the household id the RSVP
// page holds) adds the private events that household is invited to.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const wedding = requireWedding(event)
  const query = getQuery(event)
  const household =
    typeof query.code === 'string' && query.code
      ? await findByCode(db, wedding.slug, query.code)
      : typeof query.h === 'string' && UUID.test(query.h)
        ? await getHousehold(db, wedding.slug, query.h)
        : null
  const events = household
    ? eventsForHousehold(wedding, household.invitedEventIds)
    : wedding.events.filter((e) => e.isPublic)

  const host = getRequestURL(event).host
  const stamp = icsDate(new Date().toISOString())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${host}//wedding//EN`,
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsText(wedding.title)}`,
    ...events.flatMap((e) => [
      'BEGIN:VEVENT',
      `UID:${wedding.slug}-${e.id}@${host}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(e.startsAt)}`,
      `DTEND:${icsDate(e.endsAt)}`,
      `SUMMARY:${icsText(`${wedding.title}: ${e.name}`)}`,
      `LOCATION:${icsText(`${e.venue}, ${e.address}`)}`,
      ...(e.dress ? [`DESCRIPTION:${icsText(`Dress: ${e.dress}`)}`] : []),
      `URL:https://${host}/schedule`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
  setResponseHeaders(event, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="${wedding.slug}.ics"`,
    'Cache-Control': household ? 'private, no-store' : 'public, max-age=300',
  })
  return lines.join('\r\n')
})
