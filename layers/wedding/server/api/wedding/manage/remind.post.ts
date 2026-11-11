// "Email a reminder" on /manage: every household with an email that hasn't
// replied, except any reminded in the last 24 hours, so a double click or a
// second couple member can't send twice.
const COOLDOWN_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const wedding = await requireWeddingAdmin(event)
  if (!weddingEmailEnabled()) {
    throw createError({ statusCode: 409, message: 'Email is not set up for this site' })
  }
  const now = Date.now()
  const due = (await householdsToRemind(db, wedding.slug)).filter(
    (h) => !h.remindedAt || now - new Date(h.remindedAt).getTime() > COOLDOWN_MS,
  )
  const origin = getRequestURL(event).origin
  const mails = due.map((h) => reminderMail(wedding, h, origin)).filter((m) => m !== null)
  const sent = await sendWeddingMail(wedding, mails)
  if (sent > 0)
    await markReminded(
      db,
      wedding.slug,
      due.slice(0, sent).map((h) => h.id),
    )
  return { sent, eligible: due.length }
})
