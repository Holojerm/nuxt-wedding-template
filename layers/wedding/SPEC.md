# Wedding sites — product spec

Wedding websites built on one engine (the `wedding` layer): one config file per couple, one
hostname per couple, any number of couples per deployment.

Design: [`DESIGN.md`](DESIGN.md). Research: [`docs/research.md`](docs/research.md) (R1–R12 below).
Engine and operations: [`README.md`](README.md).

---

## Goals

1. A guest gets every answer they need (when, where, what to wear, where to stay, how to reply)
   in under a minute on a phone.
2. A guest RSVPs for their whole party in under two minutes without an account, a password or an
   app.
3. The couple always knows the headcount and meal counts, and can export them for the caterer.
4. No ads, no upsells, no tracking beyond the host app's cookieless analytics, nothing
   third-party in the page (R9).

**Non-goals for v1:** seating charts, a guest photo wall, payments or cash funds, live
streaming, multiple languages, guest accounts.

---

## Guests

Multi-generational, mostly on phones, many opening a link from a text message or a QR code on a
paper invitation. Design for the oldest guest on the smallest phone (R7).

---

## Pages

Every page is noindex (the site is shared by link, not found by search), forced light mode, and
uses the `wedding` layout. The couple's hostname serves only these pages; a host app's own
pages don't exist there.

| Path | Purpose | Must have |
| --- | --- | --- |
| `/` | Landing | Names, date, venue, countdown, RSVP + add-to-calendar buttons; an "at a glance" band (when / where / dress / reply-by) right below; story; public schedule (R8). In the last 14 days before the deadline, a "N days left to reply" line; after it, the RSVP button becomes "RSVPs have closed · Email us". **Day-of mode:** across the wedding weekend the page opens with Today: the next event, its time, dress and a Directions button, then the rest of the day |
| `/schedule` | The weekend | Public events as wall-label cards, numbered; local-time note; calendar download |
| `/travel` | Getting there | Venue card with Maps link; transit lines; hotels with booking links |
| `/registry` | Gifts | Intro; outbound links. Works with zero links |
| `/faq` | Questions | Dress code explained, kids, plus-ones, accessibility, photos, deadline. Plain text, searchable |
| `/rsvp` | Reply | See RSVP flow below |
| `/guide` | Nearby | Things to do around the venue, from the config's `guide`; linked as "Nearby" only when present |
| `/address` | Save-the-date addresses | Personal link `/address?code=` (or name lookup) collects a mailing address. Never linked from public pages |
| `/manage` | Couple's back office | See Admin below. Never linked from public pages |
| `/labels` | Printing | Avery 5160 address labels (30 per letter sheet) from collected addresses; country omitted for domestic mail |
| `/qr-sheet` | Printing | Every household's RSVP or address link as a cut-out QR card (`?link=rsvp\|address`) |
| `/wedding.ics` | Calendar | Every public event, one file for Apple / Google / Outlook. `?code=` or `?h=` adds the household's private events; the RSVP confirmation (page and email) links to that version |

Private events (a brunch, a rehearsal dinner) never appear on public pages. Invited households
see them on their RSVP (R4).

---

## RSVP flow

**Find the invitation**, in order of preference (R1):

1. **Personal link.** `/rsvp?code=XXXXXX`, printed as a QR code on the invitation or texted by the
   couple. Opens straight into the household's form. `/manage` copies the link per household.
2. **Full name or alias.** Matched exactly after normalizing case, accents, punctuation and
   spacing ("José O'Neil" = "jose oneil"). The couple can add aliases per guest (nicknames,
   maiden names), which match the same way. Partial matches are refused so the guest list can't be paged
   through. Two households with the same name get a pick-list of first names.
3. **Code typed by hand.** Six characters, no 0/O/1/I/L.

A miss shows "We couldn't find that name" plus the couple's email (R2). Lookups are rate-limited
per IP (20 per 10 minutes).

**Answer.** One form for the whole household. Per person, per event they're invited to: two big
buttons, "Joyfully accepts" / "Regretfully declines". If attending an event with meals, a
full-width meal choice. Per person: dietary notes. Per household: optional email, a note to
the couple, and a song request. A plus-one slot asks for the guest's name only if they're coming (R3, R7).

**Validate** on submit, naming the first problem in plain words. The server re-validates
everything: the guest must be on this invitation, the event must be one the household is invited
to, and the meal must be one the event offers.

**Read back.** After saving, the page lists every answer per event, with "Change answers". A
guest can come back any time before the deadline, find themselves the same way, and edit (R5).

**Confirm by email.** If the household has an email (stored or typed on the form), it gets a
copy of every answer with a "Change your answers" button to its personal link. Everyone in the
config's `rsvp.notifyEmails` gets a notice per reply, quoting the household's note. Emails send
as the couple ("Maya & Theo"), reply-to the contact email, and never block saving.

**Deadline.** Closes at the end of `rsvp.deadline` in the wedding's time zone. After that the form
is read-only and points at the couple's email (R6). The couple extends it by changing the date in
the config.

### Privacy model

- No guest accounts. Holding a household's random UUID, which only a successful lookup returns,
  is the authorization to answer for it.
- The guest view never includes the household's email, invite code or aliases, because a name
  lookup can match a namesake's household. A stored mailing address is shown back only to someone
  who arrived with the household's code.
- Every query filters on the wedding slug resolved from the request's **host**, never from the
  request body. One deployment can serve several weddings with no way to reach another couple's
  list.

---

## Admin (`/manage`)

Unlocked with a per-wedding admin token. Its SHA-256 is committed in the wedding's config, and
the token itself lives in the couple's password manager. Entering it once sets an httpOnly cookie for 180 days.
Rotating the token signs out every device.

- **Placeholder banner** listing the config's `placeholders` (copy that still needs real details).
- **Headcounts per event:** attending / declined / waiting / invited, plus meal counts.
- **Email panel:** whether email is set up, who gets reply notices, and **Email a reminder** to
  every household with an email that hasn't replied (confirm first; anyone reminded in the last
  24 hours is skipped).
- **Households:** search (including aliases), replied / waiting / reminded badges, guests, code,
  private events, email, mailing address, note; copy the RSVP link; a QR dialog for the RSVP
  and address links with SVG download; **edit in place** (label, email, private events, guests,
  aliases, plus-one slots); delete.
- **Printing:** address and RSVP QR sheets.
- **Bulk add:** paste one household per line:
  `Label | Guest One = Alias; Guest Two; + guest | email | private-event-ids`. All or nothing;
  errors name the line.
- **Export CSV:** one row per guest with aliases, attending + meal columns per event and the
  mailing address, ready for caterers, seating tools and envelope printers. Cells are
  formula-injection safe.

---

## Content model

| What | Where | Edited by |
| --- | --- | --- |
| Names, date, venue, story, events, travel, registry, FAQ, theme, deadline | `weddings/<slug>.ts` (typed `WeddingConfig`) | a commit or PR |
| Guest list, aliases, RSVPs, notes, addresses | D1: `wedding_households`, `wedding_guests`, `wedding_guest_aliases`, `wedding_responses` | `/manage` and guests |
| Photos, share image, Nearby guide | `public/weddings/<slug>/`, listed in the config | a PR |

Content in code keeps v1 small and versioned; the couple rarely changes it, and a PR is a fine
approval step. Event ids are stored with every RSVP, so **never rename an event id after
invitations go out.**

---

## Architecture

- **One layer, many hosts.** `app/router.options.ts` reads the hostname: on a wedding host it
  keeps only `app/pages/wedding/*` and mounts them at `/`; on any other host it removes them.
  The server resolves the wedding from the same hostname.
- **Self-contained.** The layer imports nothing from other layers or from the host app except
  two seams every host must provide: `rateLimit()` and `registerPublicApiRoutes()` (the
  template ships small versions of them). Its tables don't reference `users`.
- **Two ways to run it.** As its own Worker with its own D1 (this template), or vendored into
  an existing Nuxt app as a custom domain on that app's Worker, with the tables in its D1
  (README.md › Vendoring).

---

## Launch checklist (per couple)

1. Fill in the config and empty `placeholders`. The draft ribbon disappears.
2. Create the admin token (README.md › Admin access) and commit its hash.
3. Import the guest list on `/manage`; spot-check three households' personal links.
4. Save-the-dates: send each household its address link (text, or the address QR sheet), and
   watch the address count on `/manage`.
5. Invitations: print the RSVP QR sheet, one card per envelope, or text the RSVP link.
6. Send a test RSVP from a phone and an older relative's phone; delete the test household.
7. Two weeks before the deadline, **Email a reminder**. After it, export the CSV for the caterer.

---

## Later

Shipped since v1: song requests, personal calendars, day-of mode, the deadline nudge, address labels, confirmation and reply emails, name aliases, share image, reminders, editing
in place, QR codes, address collection, the Nearby guide.

1. **A typographic share card** for weddings without photos (today they get no preview image).
2. **Photo gallery** after the wedding, served from R2.
3. **Dress-code inspiration tiles** with example images (R8).
