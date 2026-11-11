import { z } from 'zod'

const line = (max: number) => z.string().trim().max(max)

const bodySchema = z.object({
  householdId: z.uuid(),
  email: z.union([z.email().max(200), z.literal('')]).optional(),
  address: z.object({
    line1: line(120).min(1),
    line2: line(120),
    city: line(80).min(1),
    region: line(80),
    postalCode: line(20),
    country: line(80),
  }),
})

// The save-the-date address form behind each household's /address link.
export default defineEventHandler(async (event) => {
  const wedding = requireWedding(event)
  await rateLimit(event, { name: `wedding-address:${wedding.slug}`, limit: 30, windowSeconds: 600 })
  const { householdId, address, email } = await readValidatedBody(event, bodySchema.parse)
  const ok = await saveAddress(db, wedding.slug, householdId, address, email)
  if (!ok) throw createError({ statusCode: 404, message: 'Invitation not found' })
  return { ok: true }
})
