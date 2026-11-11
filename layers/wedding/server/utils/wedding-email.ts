// Wedding mail: RSVP confirmations, the couple's "someone replied" notice, and
// reminders. It posts to Resend itself rather than through a host app's mailer
// so it can send as the couple ("Maya & Theo <hello@…>") and run in repos
// that have no mailer at all. Never throws: a guest's RSVP is saved whether or
// not the email goes out.

import type { HouseholdView, WeddingConfig, WeddingEvent } from '../../shared/utils/wedding-types'
import { eventsForHousehold, formatEventDay, formatPlainDate } from '../../shared/utils/wedding'

/** DESIGN.md › Themes, as hex: email clients don't read OKLCH. */
const EMAIL_COLORS: Record<
  WeddingConfig['theme'],
  { primary: string; paper: string; card: string; text: string; muted: string; border: string }
> = {
  catalogue: {
    primary: '#893925',
    paper: '#f9f6f1',
    card: '#f1eee7',
    text: '#332f2c',
    muted: '#665f5a',
    border: '#c9c3bc',
  },
  letterpress: {
    primary: '#204b7f',
    paper: '#faf7ee',
    card: '#f2eee3',
    text: '#2d3137',
    muted: '#5c6167',
    border: '#c8c4b9',
  },
}

export interface WeddingMail {
  to: string[]
  subject: string
  html: string
  text: string
}

interface MailConfig {
  apiKey: string
  /** The bare address, e.g. hello@example.com. */
  address: string
}

/**
 * NUXT_WEDDING_EMAIL_API_KEY / NUXT_WEDDING_EMAIL_FROM when set, else the host
 * app's own Resend settings (`resend.apiKey` / `resend.from`), if it has them.
 */
export function weddingMailConfig(config: Record<string, unknown>): MailConfig | null {
  const wedding = (config.wedding ?? {}) as { emailApiKey?: string; emailFrom?: string }
  const resend = (config.resend ?? {}) as { apiKey?: string; from?: string }
  const apiKey = wedding.emailApiKey || resend.apiKey || ''
  const from = wedding.emailFrom || resend.from || ''
  const address = from.match(/<([^>]+)>/)?.[1] ?? from.trim()
  return apiKey && address.includes('@') ? { apiKey, address } : null
}

export function weddingEmailEnabled(): boolean {
  return weddingMailConfig(useRuntimeConfig() as unknown as Record<string, unknown>) !== null
}

const sender = (wedding: WeddingConfig, address: string) =>
  `${wedding.title.replace(/[<>"]/g, '')} <${address}>`

/** Sends up to 100 messages per Resend batch call. Returns how many were accepted. */
export async function sendWeddingMail(
  wedding: WeddingConfig,
  mails: WeddingMail[],
): Promise<number> {
  const mail = weddingMailConfig(useRuntimeConfig() as unknown as Record<string, unknown>)
  if (!mail || mails.length === 0) {
    if (mails.length)
      console.warn(JSON.stringify({ kind: 'wedding_email_skipped', reason: 'unconfigured' }))
    return 0
  }
  let sent = 0
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100).map((m) => ({
      from: sender(wedding, mail.address),
      to: m.to,
      reply_to: wedding.rsvp.contactEmail,
      subject: m.subject,
      html: m.html,
      text: m.text,
    }))
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${mail.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      })
      if (res.ok) sent += chunk.length
      else console.error(JSON.stringify({ kind: 'wedding_email_failed', status: res.status }))
    } catch (error) {
      console.error(JSON.stringify({ kind: 'wedding_email_failed', error: String(error) }))
    }
  }
  return sent
}

// ── Templates ──────────────────────────────────────────────────────────────

export function escapeMailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface Block {
  heading?: string
  paragraphs?: string[]
  rows?: [string, string][]
}

/** One column, inline styles, no images: renders the same in Gmail, Apple Mail and Outlook. */
function layout(
  wedding: WeddingConfig,
  opts: {
    title: string
    blocks: Block[]
    button?: { label: string; url: string }
    footnote?: string
  },
): string {
  const c = EMAIL_COLORS[wedding.theme]
  const serif = "Georgia, 'Times New Roman', serif"
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
  const block = (b: Block) => `
      ${b.heading ? `<h2 style="margin:24px 0 8px;font-family:${serif};font-weight:normal;font-size:22px;color:${c.text}">${escapeMailHtml(b.heading)}</h2>` : ''}
      ${(b.paragraphs ?? []).map((p) => `<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${c.text}">${escapeMailHtml(p)}</p>`).join('')}
      ${
        b.rows?.length
          ? `<table role="presentation" width="100%" style="border-collapse:collapse;border-left:2px solid ${c.primary};background:${c.card}">${b.rows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:8px 12px;font-size:15px;color:${c.text}">${escapeMailHtml(k)}</td><td style="padding:8px 12px;font-size:15px;color:${c.muted};text-align:right">${escapeMailHtml(v)}</td></tr>`,
              )
              .join('')}</table>`
          : ''
      }`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeMailHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${c.paper};font-family:${sans}">
  <table role="presentation" width="100%" style="background:${c.paper}"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" style="max-width:560px">
      <tr><td style="text-align:center;padding-bottom:24px;border-bottom:1px solid ${c.border}">
        <p style="margin:0;font-family:${serif};font-size:30px;color:${c.text}">${escapeMailHtml(wedding.title)}</p>
        ${wedding.date ? `<p style="margin:8px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${c.muted}">${escapeMailHtml(formatPlainDate(wedding.date))} · ${escapeMailHtml(wedding.venue.name)}</p>` : ''}
      </td></tr>
      <tr><td style="padding-top:8px">
        <h1 style="margin:24px 0 12px;font-family:${serif};font-weight:normal;font-size:26px;color:${c.text}">${escapeMailHtml(opts.title)}</h1>
        ${opts.blocks.map(block).join('')}
        ${opts.button ? `<p style="margin:28px 0"><a href="${escapeMailHtml(opts.button.url)}" style="display:inline-block;background:${c.primary};color:#ffffff;text-decoration:none;font-size:16px;padding:14px 24px;border-radius:2px">${escapeMailHtml(opts.button.label)}</a></p>` : ''}
        ${opts.footnote ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${c.muted}">${escapeMailHtml(opts.footnote)}</p>` : ''}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

function plain(
  wedding: WeddingConfig,
  opts: {
    title: string
    blocks: Block[]
    button?: { label: string; url: string }
    footnote?: string
  },
): string {
  const lines = [wedding.title, '', opts.title, '']
  for (const b of opts.blocks) {
    if (b.heading) lines.push(b.heading)
    lines.push(...(b.paragraphs ?? []))
    for (const [k, v] of b.rows ?? []) lines.push(`  ${k}: ${v}`)
    lines.push('')
  }
  if (opts.button) lines.push(`${opts.button.label}: ${opts.button.url}`, '')
  if (opts.footnote) lines.push(opts.footnote)
  return lines.join('\n')
}

const guestName = (g: HouseholdView['guests'][number]) =>
  [g.firstName, g.lastName].filter(Boolean).join(' ') || 'Guest'

function answerBlocks(events: WeddingEvent[], household: HouseholdView, timeZone: string): Block[] {
  return events.map((e) => ({
    heading: `${e.name} · ${formatEventDay(e.startsAt, timeZone)}`,
    rows: household.guests
      .filter((g) => !g.isPlusOne || g.firstName)
      .map((g): [string, string] => {
        const r = g.responses[e.id]
        return [
          guestName(g),
          !r
            ? 'No answer'
            : r.attending
              ? `Attending${r.meal ? ` · ${r.meal}` : ''}`
              : 'Not attending',
        ]
      }),
  }))
}

const rsvpLink = (origin: string, household: HouseholdView) =>
  `${origin}/rsvp?code=${household.inviteCode}`

export function rsvpConfirmationMail(
  wedding: WeddingConfig,
  household: HouseholdView,
  origin: string,
): WeddingMail | null {
  if (!household.email) return null
  const events = eventsForHousehold(wedding, household.invitedEventIds)
  const opts = {
    title: `Thank you, ${household.label}`,
    blocks: [
      { paragraphs: ['Here is what we have for your party.'] },
      ...answerBlocks(events, household, wedding.timeZone),
      {
        paragraphs: [
          `Add your events to your calendar: ${origin}/wedding.ics?code=${household.inviteCode}`,
        ],
      },
    ],
    button: { label: 'Change your answers', url: rsvpLink(origin, household) },
    footnote: wedding.rsvp.deadline
      ? `You can change your answers until ${formatPlainDate(wedding.rsvp.deadline)}. Reply to this email with any questions.`
      : 'Reply to this email with any questions.',
  }
  return {
    to: [household.email],
    subject: `Your RSVP for ${wedding.title}`,
    html: layout(wedding, opts),
    text: plain(wedding, opts),
  }
}

export function coupleNoticeMail(
  wedding: WeddingConfig,
  household: HouseholdView,
  origin: string,
  firstReply: boolean,
): WeddingMail | null {
  if (wedding.rsvp.notifyEmails.length === 0) return null
  const events = eventsForHousehold(wedding, household.invitedEventIds)
  const opts = {
    title: `${household.label} ${firstReply ? 'replied' : 'changed their RSVP'}`,
    blocks: [
      ...(household.message ? [{ heading: 'Their note', paragraphs: [household.message] }] : []),
      ...(household.songRequest
        ? [{ heading: 'Song request', paragraphs: [household.songRequest] }]
        : []),
      ...answerBlocks(events, household, wedding.timeZone),
    ],
    button: { label: 'Open the guest list', url: `${origin}/manage` },
  }
  return {
    to: wedding.rsvp.notifyEmails,
    subject: `RSVP: ${household.label}`,
    html: layout(wedding, opts),
    text: plain(wedding, opts),
  }
}

export function reminderMail(
  wedding: WeddingConfig,
  household: HouseholdView,
  origin: string,
): WeddingMail | null {
  if (!household.email) return null
  const opts = {
    title: `${household.label}, will you join us?`,
    blocks: [
      {
        paragraphs: [
          wedding.rsvp.deadline
            ? `We’re finalizing numbers and would love to hear from you by ${formatPlainDate(wedding.rsvp.deadline)}.`
            : 'We’re finalizing numbers and would love to hear from you.',
          'The link below opens your invitation; it takes about a minute.',
        ],
      },
    ],
    button: { label: 'RSVP now', url: rsvpLink(origin, household) },
    footnote: 'Already replied by phone or in person? Reply to this email and we’ll mark it down.',
  }
  return {
    to: [household.email],
    subject: `Please RSVP: ${wedding.title}`,
    html: layout(wedding, opts),
    text: plain(wedding, opts),
  }
}
