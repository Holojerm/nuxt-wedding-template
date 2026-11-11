import { z } from 'zod'

const bodySchema = z.object({
  // The household id is a random UUID that only a successful lookup returns,
  // so holding it is the guest's proof they found their own invitation.
  householdId: z.uuid(),
  email: z.union([z.email().max(200), z.literal('')]).optional(),
  message: z.string().max(2000).optional(),
  songRequest: z.string().max(200).optional(),
  guests: z
    .array(
      z.object({
        id: z.uuid(),
        firstName: z.string().max(80).optional(),
        lastName: z.string().max(80).optional(),
        dietary: z.string().max(500).optional(),
        events: z
          .array(
            z.object({
              eventId: z.string().min(1).max(60),
              attending: z.boolean(),
              meal: z.string().max(60).nullable().optional(),
            }),
          )
          .max(20),
      }),
    )
    .min(1)
    .max(20),
})

export default defineEventHandler(async (event) => {
  const wedding = requireWedding(event)
  await rateLimit(event, { name: `wedding-rsvp:${wedding.slug}`, limit: 30, windowSeconds: 600 })
  if (rsvpClosed(wedding)) {
    throw createError({
      statusCode: 409,
      message: `RSVPs have closed. Please email ${wedding.rsvp.contactEmail}.`,
    })
  }
  const { householdId, ...input } = await readValidatedBody(event, bodySchema.parse)
  const before = await getHousehold(db, wedding.slug, householdId)
  let household
  try {
    household = await saveRsvp(db, wedding, householdId, input)
  } catch (error) {
    if (error instanceof RsvpError) throw createError({ statusCode: 422, message: error.message })
    throw error
  }

  // Awaited, not deferred: one batch call, and a send that silently never
  // happened is worse than a slower button. sendWeddingMail() never throws.
  const origin = getRequestURL(event).origin
  const mails = [
    rsvpConfirmationMail(wedding, household, origin),
    coupleNoticeMail(wedding, household, origin, before?.respondedAt === null),
  ].filter((m) => m !== null)
  const emailed = (await sendWeddingMail(wedding, mails)) > 0 && Boolean(household.email)

  return { ...toInvitation(wedding, household), emailed }
})
