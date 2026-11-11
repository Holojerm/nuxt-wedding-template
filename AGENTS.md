# nuxt-wedding-template

A wedding website on Cloudflare Workers: Nuxt 4, NuxtUI, D1 for the guest list. All product code
is the `wedding` layer in `layers/wedding/`; the rest of the repo is a thin shell that wires it
to Cloudflare. This repo is the layer's source of truth.

- **Content** for a couple is one typed file, `layers/wedding/weddings/<slug>.ts`, registered in
  `weddings/index.ts`. Photos go in `public/weddings/<slug>/`.
- **Read first:** `layers/wedding/README.md` (operations), `SPEC.md` (product), `DESIGN.md`
  (design system; change a value there before changing `wedding.css`).
- Host seams the layer needs: `server/utils/rate-limit.ts` (KV counter),
  `server/utils/public-routes.ts` (no-op, as there are no sessions), `app/composables/useSeo.ts`.
- Event ids are stored with every RSVP. Never rename one after invitations go out.
- The engine stays free of any one couple's names, domains or venue. Those belong in `weddings/`.
- Email is off until `NUXT_WEDDING_EMAIL_API_KEY` and `NUXT_WEDDING_EMAIL_FROM` are set as Worker
  secrets. See `layers/wedding/README.md › Email`.

## Commands

```bash
bun run dev           # then open http://localhost:3000/?wedding=mayatheo
bun run test          # engine tests, in workerd against a real D1
bun run ci            # typecheck + test + build: run before every push
bun run deploy        # ci, then remote D1 migrations, then wrangler deploy
bun run db:generate   # after a schema change
```

Use bun, not npm. Deploys are manual (`bun run deploy`); pushing to `main` doesn't deploy.
