export default defineEventHandler(async (event) => {
  const wedding = await requireWeddingAdmin(event)
  const ok = await deleteHousehold(db, wedding.slug, getRouterParam(event, 'id') ?? '')
  if (!ok) throw createError({ statusCode: 404, message: 'Not found' })
  return { ok: true }
})
