# `wedding` layer

Wedding websites, one per couple, each on its own hostname, all from one engine. Product:
[`SPEC.md`](SPEC.md). Design: [`DESIGN.md`](DESIGN.md).

```
weddings/            one config per couple + the index  ← per-repo content
shared/utils/        types and pure helpers (name matching, import parser, deadline)
app/router.options.ts  swaps the route table by hostname
app/pages/wedding/   the pages, mounted at / on a wedding host
app/layouts/wedding.vue, app/components/Wedding/, app/assets/css/wedding.css
server/db/schema.ts  wedding_households, wedding_guests, wedding_responses
server/utils/        host → wedding, admin check, guest-list store
server/api/wedding/  lookup, rsvp, manage/*
server/routes/wedding.ics.get.ts
```

## Adding a wedding

1. Copy `weddings/mayatheo.ts` to `weddings/<slug>.ts`, set `slug`, `hosts`, `theme` and the
   content, and register it in `weddings/index.ts`.
2. Add the hostname as a custom domain: a `[[routes]]` entry with `custom_domain = true` in
   `wrangler.toml` (the zone must be on the same Cloudflare account). A workers.dev hostname
   needs no route, only an entry in `hosts`.
3. Create the admin token (below).

Locally, the dev server can't answer on the real hostname, so open any page with
`?wedding=<slug>` to pin a wedding for your browser; `?wedding=` clears it. This works only
under `nuxt dev`.

## Admin access

`/manage` is unlocked by a per-wedding token. Only its SHA-256 is committed. Create a token,
save it in your password manager, and paste the hash into the config's `adminTokenSha256`:

```bash
TOKEN=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=') && echo "token: $TOKEN" && printf '%s' "$TOKEN" | shasum -a 256 | cut -d' ' -f1; unset TOKEN
```

Share the token with the couple. To rotate, run it again and replace the hash; every signed-in
device is signed out.

## Email

Confirmations, reply notices and reminders go straight to [Resend](https://resend.com)'s batch
API, sent as the couple (`"Maya & Theo" <address>`) with reply-to set to the wedding's
`rsvp.contactEmail`. Settings, first match wins:

1. `NUXT_WEDDING_EMAIL_API_KEY` and `NUXT_WEDDING_EMAIL_FROM` (the address is taken from
   `Name <address>` or used as is);
2. the host app's `resend.apiKey` and `resend.from` runtime config, if it has them.

With neither, nothing sends and `/manage` says so. Who hears about replies is the config's
`rsvp.notifyEmails`.

## Letters that open later (optional)

Set `letters: { url, opensOn }` in a wedding's file to print cards that ask guests to write
the couple a letter, for example a [Dear Mantel](https://dearmantel.com) write link whose
letters stay sealed until the first anniversary. `/qr-sheet?link=letters` prints the link as a
QR code, nine cards to a page, and a "Letter cards" button appears on `/manage`. The site only
prints the address: it never sees a letter. Paste the whole address, including the part after
the `#`, which the letter service uses to check its own key.

To show the link to guests as well, on the home page and after they reply, set
`letters.showOnSite: true`. Anyone who can open the site can then write a letter.

## Shared host (optional)

By default a wedding is a file in `weddings/` and its hostname picks it. A host app that keeps
weddings elsewhere, or serves many under one hostname (`example.com/<slug>`), sets the wedding
on the request itself, in server middleware that runs before the layer's handlers:

```ts
event.context.wedding = config          // a WeddingConfig from wherever the host keeps them
event.context.weddingBase = '/maya-theo' // the path it is mounted under; omit at the root
event.context.weddingAdmin = true        // only once the host has checked this is the couple
event.context.weddingSignInUrl = '/login' // where /manage sends a couple who is not signed in
```

- The pages then mount under `weddingBase`, and every link and request the layer makes carries
  it (`useWeddingUrl()`). The host must route `<base>/api/wedding/*` and `<base>/wedding.ics` to
  the layer's handlers, for example by stripping the base from the request path after setting
  the context.
- The config is sent to the browser. Leave `adminTokenSha256` empty and `rsvp.notifyEmails`
  out of what you set, unless guests may see them.
- With `weddingAdmin` unset, the admin token still works if the config has a hash.
- Entering a wedding from the host's own pages needs a full page load, not a client-side
  navigation: the route table is chosen when the app starts.

## Vendoring into another repo

The layer is self-contained, so an existing Nuxt app can serve wedding sites next to its own
pages. Copy everything except `weddings/`, which holds that repo's own couples:

```bash
rsync -a --delete --exclude weddings/ --exclude docs/ --exclude test/ ../nuxt-wedding-template/layers/wedding/ layers/wedding/
```

The host repo must provide:

- `@nuxt/ui`, `@nuxthub/core` (`hub.db: 'sqlite'`), `@nuxt/image` (needed only once a wedding has
  `photos`), `uqr` (QR codes on `/manage`), `drizzle-orm`, `zod`;
- the layer's tables exported from its Drizzle schema, plus a generated migration;
- two server utils with these signatures (this template's are in `server/utils/`):
  - `rateLimit(event, { name, limit, windowSeconds }): Promise<void>` throws 429 when over;
  - `registerPublicApiRoutes(routes): void`, which tells a host with a session gate that the
    wedding API is public; a host without sessions can no-op it;
- `useSeo({ title, titleMode, description, noindex })` in the app.

Engine changes go into [nuxt-wedding-template](https://github.com/Holojerm/nuxt-wedding-template)
first and are copied out, so there is one source of truth.
