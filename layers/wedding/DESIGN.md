# Wedding sites — design system

The visual contract for every wedding site the `wedding` layer serves. One system, one
theme per couple. A host app's own design system does not apply on a
wedding host: the wedding layout swaps the tokens out from under NuxtUI, so components are the
same and only the values change.

Research behind the decisions: [`docs/research.md`](docs/research.md) (cited below as R1–R12,
its numbered takeaways).

**Where the tokens live:** `app/assets/css/wedding.css`, compiled by hand from this file. Every
rule there is scoped to `:root[data-wedding-theme]`, which only `app/layouts/wedding.vue` sets.
Change a value here first, then in the CSS.

---

## Principles

1. **Logistics first, romance second.** Every page answers a guest's question: when, where, what
   to wear, how to reply, where to sleep. Decoration never sits between a guest and those answers
   (R8).
2. **Editorial, not template.** A strong serif display face, a plain sans for details, generous
   white space, one voice. No script fonts, no stock florals, no confetti (R10).
3. **Built for the oldest guest on the smallest phone.** 18px body, 44px+ targets, big two-choice
   buttons, visible labels, plain-language errors. If it works for a grandparent on an iPhone SE,
   it works for everyone (R7).
4. **The venue is the motif.** Each theme borrows from its real venue, lightly. Labels and
   numbering, not illustrations (R11, R12).
5. **Quiet by default.** No ads, no countdown animations, no autoplaying music, no parallax. The
   only motion is NuxtUI's own focus and hover transitions (R9).

---

## Themes

A theme sets three ramps (`primary`, `secondary`, `neutral`, 50–950 each), two font families
and a radius. The shared rules below map ramps to NuxtUI's semantic variables the same way for
every theme. Add a theme by adding a block to `wedding.css`, a name to `WeddingTheme` in
`shared/utils/wedding-types.ts`, and a section here.

### `catalogue` — a museum wedding

Drawn for a neo-Georgian museum in red brick with marble trim, facing a formal garden. The
theme reads like a museum's own exhibition catalogue: ivory stock, black label type, brick-red
rules.

| Role | Ramp | Hue (OKLCH) | Source |
| --- | --- | --- | --- |
| `primary` | brick | 35 | the façade's red brick |
| `secondary` | park | 155 | the garden across the street |
| `neutral` | marble/ink | 60–85, near-zero chroma | marble trim, gallery-label black |

- **Display:** Cormorant Garamond 500, italic for the "and". A high-contrast old-style serif
  fits a 1930s institution without going costume.
- **Body and labels:** Jost. A geometric sans in the Futura family, contemporary with the
  building (Futura dates from 1927) and very legible at small sizes in uppercase.
- **Radius:** 0.125rem. Nearly square, like a mat board.

### `letterpress` — venue-neutral

For a wedding whose venue isn't chosen yet, or doesn't suggest a palette: cream card stock,
ink blue, sage. The sample wedding uses it.

| Role | Ramp | Hue (OKLCH) |
| --- | --- | --- |
| `primary` | ink blue | 255 |
| `secondary` | sage | 135 |
| `neutral` | cream → blue-black | 90 → 260 |

- **Display:** Fraunces 400. A soft, warm serif that reads like printed stationery.
- **Body and labels:** Figtree.
- **Radius:** 0.375rem.

---

## Color

Shared across every theme (`:root[data-wedding-theme]` in the CSS):

| Variable | Shade | Why |
| --- | --- | --- |
| `--ui-bg` | neutral-50 | paper, never white |
| `--ui-bg-elevated`, `--ui-bg-muted` | neutral-100 | event cards and bands |
| `--ui-border` | neutral-300 | rules read at arm's length |
| `--ui-text` | neutral-800 | body text, ≈11:1 on paper |
| `--ui-text-muted` | neutral-600 | secondary text, ≥5.5:1 |
| `--ui-text-highlighted` | neutral-950 | names and headings |
| `--ui-primary` | primary-700 | buttons, rules, the "and"; white on it ≥7:1 |
| `--ui-secondary` | secondary-700 | wall-label eyebrows |

Use only semantic utilities in wedding components (`text-muted`, `bg-elevated`,
`border-primary`), never raw palette classes, so a theme change reaches every component.
Colors are defined in OKLCH, which keeps lightness steps even across hues and is the space
Tailwind v4's own palette uses.

### Color mode

**Light only.** Every wedding page declares `colorMode: 'light'`. Invitations are paper, and a
wedding site in dark mode reads like a different event. It also halves the contrast surface to
verify. There is no color-mode toggle.

---

## Typography

| Step | Use | Size (at the 18px root) |
| --- | --- | --- |
| `text-8xl` / `text-6xl` | couple's names, home hero (desktop / mobile) | 6rem / 3.75rem |
| `text-6xl` | page `<h1>` | 3.75rem |
| `text-5xl`, `text-4xl` | section headings | 3rem, 2.25rem |
| `text-3xl` | event names, FAQ questions | 1.875rem |
| `text-lg` | lead paragraphs, FAQ answers, RSVP questions | 1.125rem |
| base | body | 1rem = **18px** |
| `text-sm` | captions, secondary detail | 0.875rem |
| `text-xs` uppercase `tracking-[0.2em]` | wall-label eyebrows only | 0.75rem |

- The wedding root sets `font-size: 112.5%`, so every rem-based NuxtUI size scales up with it
  (R7). Never set body text below `text-sm`.
- `h1`–`h3` and `.wedding-display` use the display face; everything else uses the sans.
- One `<h1>` per page.
- Uppercase is reserved for labels and the nav. Never set a sentence in caps.

---

## Layout

- Reading column `max-w-2xl` for content pages; `max-w-(--ui-container)` (64rem) for the
  header, footer, home bands and `/manage`.
- Side gutter `px-4`, `sm:px-6`. Sections breathe: `py-16` for pages, `py-20`–`py-28` for the
  home hero.
- Mobile first. The header collapses to the title, an RSVP button and a menu button below `md`.
  **RSVP is always visible in the header at every width.**

---

## Motifs

Used sparingly. Each one has a job beyond decoration.

- **Wall label** (`WeddingLabel`): a small uppercase eyebrow, optionally numbered like a
  catalogue plate (`No. 02 — The weekend`). It marks sections and is decorative; the real
  heading always follows it.
- **Event placard** (`WeddingEventCard`): an event set out in a museum label's order —
  title, time, place, dress, note — on an elevated card with a 2px primary rule on the left
  (R12).
- **Draft ribbon**: an inverted bar at the very top while the wedding's `placeholders` list is
  non-empty, so nobody mistakes placeholder copy for the real date.

---

## Components

NuxtUI first. Wedding-specific components live in
`app/components/Wedding/`.

| Need | Use |
| --- | --- |
| Primary action (RSVP, send) | `UButton size="xl"` solid primary |
| Secondary action (calendar, travel) | `UButton` `color="neutral" variant="outline"` |
| Yes/no per event | two `UButton size="xl" block` side by side, `aria-pressed`, labeled "Joyfully accepts" / "Regretfully declines" — never a checkbox or a small radio (R7) |
| Meal choice | `URadioGroup variant="table" size="xl"` (full-width rows) |
| Text entry | `UFormField` with a visible label + `UInput size="xl"` |
| Errors | `UAlert color="error" role="alert"` with one plain sentence that names the fix |
| Mobile menu | `USlideover side="right"` with links in the display face |

FAQ answers are plain headings and paragraphs, not an accordion, so browser search finds
every answer.

---

## Accessibility

The baseline applies on every page (AA contrast, a visible focus ring,
`alt` on images, `aria-label` on icon-only buttons, `min-touch` on them, `min-h-dvh`). On top
of it:

- 18px base font; tap targets are `size="xl"` (≥44px) everywhere a guest taps.
- Every RSVP question is a `role="group"` labeled by the question text.
- Validation runs on submit and reports the *first* unanswered question by name ("Please choose
  a meal for Sam Lee at Dinner & dancing"), not a field-by-field red wash.
- After submitting, the page reads every answer back so mistakes are caught before the day
  (R7's review step).

---

## Imagery

- Photos are optional; every page has to work with none.
- **Venue plates** (`WeddingPlate`): up to three photographs on the home page under "The venue",
  one wide plate and then two side by side. Each is matted (a 1px border and padding on
  `bg-elevated`), numbered in Roman numerals ("Plate II"), and captioned in the wall-label voice:
  one factual sentence, never a superlative.
- **Sources:** the couple's own photos, or freely licensed ones (Wikimedia Commons CC BY / CC
  BY-SA / public domain) with the credit the license requires printed under the caption, linked
  to the source and the license and marked "cropped" when it is. Never the venue's own marketing
  photography or anything found through an image search.
- **Tasteful means:** daylight or warm interior light, architecture over crowds, no exhibit
  banners, vehicles, signage or people in focus. Crop them out rather than settle.
- **Delivery:** commit one high-resolution master per photo (≤2400px wide, JPEG q85) to
  `public/weddings/<slug>/` and render it with `<NuxtImg>`, which uses Cloudflare's edge to cut
  1x/2x renditions per breakpoint and serve AVIF or WebP. This needs Image Transformations
  turned on for the zone, and a custom domain: workers.dev has no image resizing, so the
  template serves the masters as they are until you switch `image.provider` to `cloudflare` in
  `nuxt.config.ts`. The first plate is
  lazy-loaded like the rest, since it sits below the fold.
- No map embeds (they need third-party frames the CSP refuses, and they're slow); link to the
  phone's maps app instead.

---

## Voice

Warm, brief and specific. "Please arrive by 5:00 pm. The ceremony starts on time." beats "We
can't wait to celebrate with you!". Use the traditional phrasing in exactly two places, where
guests expect it: "request the pleasure of your company" and "joyfully accepts / regretfully
declines".
