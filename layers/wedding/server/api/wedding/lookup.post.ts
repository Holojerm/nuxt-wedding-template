import { z } from 'zod'

const bodySchema = z.union([
  z.object({ name: z.string().trim().min(3).max(120) }),
  z.object({ code: z.string().trim().min(4).max(20) }),
])

// Find an invitation by a guest's full name (or an alias) or by the code
// printed on it. Throttled per IP: an exact-name match is the only thing
// standing between the guest list and anyone who can guess names.
export default defineEventHandler(async (event) => {
  const wedding = requireWedding(event)
  await rateLimit(event, { name: `wedding-lookup:${wedding.slug}`, limit: 20, windowSeconds: 600 })
  const body = await readValidatedBody(event, bodySchema.parse)

  if ('code' in body) {
    const household = await findByCode(db, wedding.slug, body.code)
    return {
      closed: rsvpClosed(wedding),
      // Holding the code is holding the invitation, so the address it already
      // gave us can be shown back for editing.
      invitations: household ? [toInvitation(wedding, household, { revealAddress: true })] : [],
    }
  }
  const households = await findByName(db, wedding.slug, body.name)
  return {
    closed: rsvpClosed(wedding),
    invitations: households.map((h) => toInvitation(wedding, h)),
  }
})
