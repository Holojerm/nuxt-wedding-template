import { z } from 'zod'

const name = z.string().trim().max(80)

const bodySchema = z.object({
  label: z.string().trim().min(1).max(120),
  email: z.union([z.email().max(200), z.literal(''), z.null()]),
  invitedEventIds: z.array(z.string().min(1).max(60)).max(20),
  guests: z
    .array(
      z.object({
        id: z.uuid().optional(),
        firstName: name,
        lastName: name,
        isPlusOne: z.boolean(),
        aliases: z.array(z.string().trim().max(120)).max(10),
      }),
    )
    .min(1)
    .max(20),
})

export default defineEventHandler(async (event) => {
  const wedding = await requireWeddingAdmin(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const known = new Set(wedding.events.map((e) => e.id))
  if (body.invitedEventIds.some((e) => !known.has(e))) {
    throw createError({ statusCode: 422, message: 'Unknown event' })
  }
  if (!body.guests.some((g) => !g.isPlusOne && g.firstName)) {
    throw createError({ statusCode: 422, message: 'A household needs at least one named guest' })
  }
  const ok = await editHousehold(db, wedding.slug, getRouterParam(event, 'id') ?? '', {
    ...body,
    email: body.email || null,
  })
  if (!ok) throw createError({ statusCode: 404, message: 'Not found' })
  return { ok: true }
})
