import { z } from 'zod'

const bodySchema = z.object({ token: z.string().min(16).max(200) })

// Trades the couple's admin token for an httpOnly cookie holding it, so the
// token is typed once per device. Rotating the token (a new hash in the
// wedding's config) signs every device out.
export default defineEventHandler(async (event) => {
  const wedding = requireWedding(event)
  await rateLimit(event, { name: `wedding-admin:${wedding.slug}`, limit: 10, windowSeconds: 600 })
  const { token } = await readValidatedBody(event, bodySchema.parse)
  if (!(await isWeddingAdminToken(wedding, token))) {
    throw createError({ statusCode: 401, message: 'That token is not right' })
  }
  setCookie(event, WEDDING_ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  })
  return { ok: true }
})
