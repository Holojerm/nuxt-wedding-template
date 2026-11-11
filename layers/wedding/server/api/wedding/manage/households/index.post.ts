import { z } from 'zod'

const bodySchema = z.object({ text: z.string().min(1).max(100_000) })

// Bulk import: one household per line, parsed by parseGuestImport(). All or
// nothing — a single bad line rejects the paste so nobody is half-imported.
export default defineEventHandler(async (event) => {
  const wedding = await requireWeddingAdmin(event)
  const { text } = await readValidatedBody(event, bodySchema.parse)
  const { households, errors } = parseGuestImport(
    text,
    wedding.events.map((e) => e.id),
  )
  if (errors.length) {
    throw createError({ statusCode: 422, message: errors.slice(0, 5).join('\n') })
  }
  const created = await createHouseholds(db, wedding.slug, households)
  setResponseStatus(event, 201)
  return { created }
})
