export default defineEventHandler((event) => {
  requireWedding(event)
  deleteCookie(event, WEDDING_ADMIN_COOKIE, { path: '/' })
  return { ok: true }
})
