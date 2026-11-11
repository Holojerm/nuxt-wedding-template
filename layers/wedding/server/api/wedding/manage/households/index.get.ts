export default defineEventHandler(async (event) => {
  const wedding = await requireWeddingAdmin(event)
  const households = await listHouseholds(db, wedding.slug)
  return {
    households,
    tallies: tallyEvents(wedding, households),
    events: wedding.events.map((e) => ({ id: e.id, name: e.name, isPublic: e.isPublic })),
    placeholders: wedding.placeholders,
    emailEnabled: weddingEmailEnabled(),
    notifyEmails: wedding.rsvp.notifyEmails,
  }
})
