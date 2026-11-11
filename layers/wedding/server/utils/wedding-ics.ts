// iCalendar (RFC 5545) formatting for the /wedding.ics route.

/** UTC basic format: 2027-06-12T21:30:00Z → 20270612T213000Z. */
export function icsDate(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** Escapes backslash, semicolon and comma, and folds newlines, per RFC 5545 §3.3.11. */
export function icsText(s: string): string {
  return s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
}
