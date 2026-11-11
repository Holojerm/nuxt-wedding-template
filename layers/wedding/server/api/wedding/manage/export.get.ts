// Every guest, one row each, with an attending/meal column pair per event —
// the shape caterers and seating-chart tools ask for.
export default defineEventHandler(async (event) => {
  const wedding = await requireWeddingAdmin(event)
  const households = await listHouseholds(db, wedding.slug)
  const header = [
    'Household',
    'Invite code',
    'Email',
    'First name',
    'Last name',
    'Also known as',
    'Plus-one',
    'Dietary',
    ...wedding.events.flatMap((e) => [e.name, `${e.name} meal`]),
    'Message',
    'Song request',
    'Address line 1',
    'Address line 2',
    'City',
    'State/Region',
    'Postal code',
    'Country',
  ]
  const rows = households.flatMap((h) =>
    h.guests.map((g) => [
      h.label,
      h.inviteCode,
      h.email,
      g.firstName,
      g.lastName,
      g.aliases.join('; '),
      g.isPlusOne ? 'yes' : '',
      g.dietary,
      ...wedding.events.flatMap((e) => {
        const invited = e.isPublic || h.invitedEventIds.includes(e.id)
        const r = g.responses[e.id]
        return [!invited ? '' : !r ? 'pending' : r.attending ? 'yes' : 'no', r?.meal ?? '']
      }),
      h.message,
      h.songRequest,
      h.mailingAddress?.line1,
      h.mailingAddress?.line2,
      h.mailingAddress?.city,
      h.mailingAddress?.region,
      h.mailingAddress?.postalCode,
      h.mailingAddress?.country,
    ]),
  )
  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${wedding.slug}-guests.csv"`,
    'Cache-Control': 'no-store',
  })
  return [header, ...rows].map((r) => r.map(csvField).join(',')).join('\r\n')
})
